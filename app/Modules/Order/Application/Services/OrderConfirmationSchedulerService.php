<?php

namespace App\Modules\Order\Application\Services;

use App\Modules\Marketing\Application\Services\NotificationDispatcher;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderStatusHistory;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Payment\Application\Services\RefundService;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Enums\PaymentStatus;
use App\Modules\Shipping\Application\Services\DeliveryService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderConfirmationSchedulerService
{
    public function __construct(
        protected NotificationDispatcher $dispatcher,
        protected DeliveryService $deliveryService,
        protected ?RefundService $refundService = null,
    ) {
        if (! $this->refundService && class_exists(RefundService::class)) {
            $this->refundService = app(RefundService::class);
        }
    }

    /**
     * Process all scheduled confirmation tasks:
     * 1. Auto-cancel expired unconfirmed orders (> vendor confirmation deadline).
     * 2. Auto-confirm eligible orders (when auto-confirmation enabled & cancellation window passed).
     */
    public function run(): array
    {
        $expiredCount = $this->processExpiredVendorConfirmations();
        $autoConfirmedCount = $this->processAutoConfirmations();

        return [
            'expired_cancelled' => $expiredCount,
            'auto_confirmed' => $autoConfirmedCount,
        ];
    }

    /**
     * Requirement 2:
     * If the vendor does not confirm within the configured maximum confirmation time of 24 hours,
     * automatically cancel the eligible order with the reason: "Vendor did not confirm within the allowed time".
     */
    public function processExpiredVendorConfirmations(): int
    {
        $deadlineHours = (int) Setting::get('order.vendor_confirmation_deadline_hours', 24);
        if ($deadlineHours <= 0) {
            $deadlineHours = 24;
        }

        $cutoff = now()->subHours($deadlineHours);

        $pendingVendorOrders = VendorOrder::query()
            ->where('status', OrderStatus::PENDING)
            ->where('created_at', '<=', $cutoff)
            ->with(['order.items', 'order.vendorOrders', 'items.product', 'items.variant'])
            ->get();

        $cancelledCount = 0;

        foreach ($pendingVendorOrders as $vendorOrder) {
            $cancelled = DB::transaction(function () use ($vendorOrder, $deadlineHours) {
                $vo = VendorOrder::query()->whereKey($vendorOrder->id)->lockForUpdate()->first();
                if (! $vo || $vo->status !== OrderStatus::PENDING) {
                    return false;
                }

                $order = $vo->order()->lockForUpdate()->first();
                $placedAt = $order?->placed_at ?? $order?->created_at ?? $vo->created_at;
                $deadline = Carbon::parse($placedAt)->addHours($deadlineHours);

                if (now()->lessThan($deadline)) {
                    return false;
                }

                $reason = 'Vendor did not confirm within the allowed time';

                $vo->status = OrderStatus::CANCELLED;
                $vo->delivery_status = DeliveryStatus::FAILED;
                $meta = (array) ($vo->meta ?? []);
                $meta['cancellation_reason'] = $reason;
                $meta['cancelled_at'] = now()->toISOString();
                $meta['cancelled_by'] = 'system';
                $vo->meta = $meta;
                $vo->save();

                OrderStatusHistory::create([
                    'trackable_type' => VendorOrder::class,
                    'trackable_id' => $vo->id,
                    'from_status' => OrderStatus::PENDING->value,
                    'to_status' => OrderStatus::CANCELLED->value,
                    'reason' => $reason,
                    'actor_user_id' => null,
                ]);

                // Restore stock for the items in this vendor order
                $this->restoreVendorOrderStock($vo);

                // Check parent order
                if ($order) {
                    $order->load('vendorOrders');
                    $allTerminal = $order->vendorOrders->every(function ($otherVo) {
                        return in_array($otherVo->status, [
                            OrderStatus::CANCELLED,
                            OrderStatus::REJECTED,
                            OrderStatus::RETURNED,
                            OrderStatus::REFUNDED,
                            OrderStatus::FAILED,
                        ], true);
                    });

                    if ($allTerminal && $order->status !== OrderStatus::CANCELLED) {
                        $fromOrder = $order->status->value;
                        $order->status = OrderStatus::CANCELLED;
                        $order->cancelled_at = now();
                        $order->cancelled_reason = $reason;
                        $order->save();

                        OrderStatusHistory::create([
                            'trackable_type' => Order::class,
                            'trackable_id' => $order->id,
                            'from_status' => $fromOrder,
                            'to_status' => OrderStatus::CANCELLED->value,
                            'reason' => $reason,
                            'actor_user_id' => null,
                        ]);

                        // Handle payment refund or cancellation if needed
                        $this->handlePaymentCancellation($order, $reason);
                    }
                }

                try {
                    $this->dispatcher->orderDeliveryUpdate($vo, 'cancelled');
                } catch (\Throwable $e) {
                    Log::warning('Failed to dispatch cancellation notification: ' . $e->getMessage());
                }

                return true;
            });

            if ($cancelled) {
                $cancelledCount++;
            }
        }

        return $cancelledCount;
    }

    /**
     * Requirement 3:
     * When automatic confirmation is enabled:
     * - Automatically confirm eligible orders after the admin-configured auto-confirmation duration.
     * - Do not auto-confirm before the minimum customer cancellation window expires.
     * - Validate that the order is still pending, eligible, and not cancelled, expired, or otherwise blocked.
     * - Respect payment requirements: do not confirm an online-payment order until the payment state satisfies the existing payment policy.
     * - Record the confirmation method as "automatic", along with the timestamp and applicable system actor.
     */
    public function processAutoConfirmations(): int
    {
        $platformAutoEnabled = (bool) Setting::get('order.auto_confirmation_enabled', false);

        $cancellationWindowMins = (int) Setting::get('order.cancellation_window_minutes', 15);
        $platformAutoMins = (int) Setting::get('order.auto_confirmation_minutes', 30);
        $deadlineHours = (int) Setting::get('order.vendor_confirmation_deadline_hours', 24);
        $deadlineMins = $deadlineHours * 60;

        $pendingVendorOrders = VendorOrder::query()
            ->where('status', OrderStatus::PENDING)
            ->with(['order.vendorOrders', 'store', 'vendor.stores'])
            ->get();

        $confirmedCount = 0;

        foreach ($pendingVendorOrders as $vendorOrder) {
            $store = $vendorOrder->store ?? $vendorOrder->vendor?->stores->first();
            $storeSettings = (array) ($store?->settings ?? []);
            $storeAuto = ($storeSettings['order_confirmation_mode'] ?? 'manual') === 'automatic';

            // Only proceed if platform auto-confirm is enabled OR store has automatic mode
            if (! $platformAutoEnabled && ! $storeAuto) {
                continue;
            }

            $storeAutoMins = isset($storeSettings['auto_confirmation_minutes'])
                ? (int) $storeSettings['auto_confirmation_minutes']
                : $platformAutoMins;

            // Precedence Rule: Auto confirmation duration must never precede the customer cancellation window
            $effectiveAutoMins = max($storeAutoMins, $cancellationWindowMins);

            // If auto-confirmation duration exceeds or equals the deadline, it cannot auto confirm
            if ($effectiveAutoMins >= $deadlineMins) {
                continue;
            }

            $confirmed = DB::transaction(function () use ($vendorOrder, $effectiveAutoMins, $cancellationWindowMins, $deadlineHours, $storeSettings) {
                $vo = VendorOrder::query()->whereKey($vendorOrder->id)->lockForUpdate()->first();
                if (! $vo || $vo->status !== OrderStatus::PENDING) {
                    return false;
                }

                $order = $vo->order()->lockForUpdate()->first();
                if (! $order) {
                    return false;
                }

                $placedAt = Carbon::parse($order->placed_at ?? $order->created_at ?? $vo->created_at);

                // 1. Must satisfy minimum customer cancellation window
                $cancellationWindowEnds = $placedAt->copy()->addMinutes($cancellationWindowMins);
                if (now()->lessThan($cancellationWindowEnds)) {
                    return false;
                }

                // 2. Must satisfy auto confirmation duration
                $autoConfirmAt = $placedAt->copy()->addMinutes($effectiveAutoMins);
                if (now()->lessThan($autoConfirmAt)) {
                    return false;
                }

                // 3. Must not exceed maximum vendor confirmation deadline
                $deadline = $placedAt->copy()->addHours($deadlineHours);
                if (now()->greaterThanOrEqualTo($deadline)) {
                    return false;
                }

                // 4. Respect payment requirements:
                // Do not confirm an online-payment order until the payment state satisfies the payment policy
                $isCod = strcasecmp((string) $order->payment_method, PaymentMethod::COD->value) === 0
                    || stripos((string) $order->payment_method, 'cod') !== false
                    || stripos((string) $order->payment_method, 'cash') !== false;

                if (! $isCod) {
                    $isPaid = $order->payment_status === OrderPaymentStatus::PAID;
                    if (! $isPaid) {
                        return false; // Wait until payment is completed
                    }
                }

                // 5. Check if store requested auto ready for pickup
                $autoReady = (bool) ($storeSettings['auto_ready_for_pickup'] ?? false);
                $targetStatus = $autoReady ? OrderStatus::READY_FOR_PICKUP : OrderStatus::ACCEPTED;

                $vo->status = $targetStatus;
                $meta = (array) ($vo->meta ?? []);
                $meta['confirmation_method'] = 'automatic';
                $meta['confirmed_at'] = now()->toISOString();
                $meta['confirmed_by'] = 'system';
                $vo->meta = $meta;
                $vo->save();

                OrderStatusHistory::create([
                    'trackable_type' => VendorOrder::class,
                    'trackable_id' => $vo->id,
                    'from_status' => OrderStatus::PENDING->value,
                    'to_status' => $targetStatus->value,
                    'reason' => 'Automatically confirmed by system after auto-confirmation duration.',
                    'actor_user_id' => null,
                ]);

                // Sync parent order
                $order->status = $autoReady ? OrderStatus::READY_FOR_PICKUP : OrderStatus::CONFIRMED;
                if (! $order->confirmed_at) {
                    $order->confirmed_at = now();
                }
                $order->save();

                OrderStatusHistory::create([
                    'trackable_type' => Order::class,
                    'trackable_id' => $order->id,
                    'from_status' => OrderStatus::PENDING->value,
                    'to_status' => $order->status->value,
                    'reason' => 'Automatically confirmed by system after auto-confirmation duration.',
                    'actor_user_id' => null,
                ]);

                try {
                    $event = $autoReady ? 'ready_for_pickup' : 'confirmed';
                    $this->dispatcher->orderDeliveryUpdate($vo, $event);
                } catch (\Throwable $e) {
                    Log::warning('Failed to dispatch auto-confirmation notification: ' . $e->getMessage());
                }

                return true;
            });

            if ($confirmed) {
                $confirmedCount++;
            }
        }

        return $confirmedCount;
    }

    protected function restoreVendorOrderStock(VendorOrder $vo): void
    {
        foreach ($vo->items as $item) {
            if ($item->variant_id) {
                $item->variant?->increment('quantity', $item->quantity);
                $item->variant?->update(['stock_status' => 'in_stock']);
            }

            if ($item->product_id) {
                $item->product?->increment('quantity', $item->quantity);
                $item->product?->update(['stock_status' => 'in_stock']);
            }
        }
    }

    protected function handlePaymentCancellation(Order $order, string $reason): void
    {
        $payment = Payment::query()->where('order_id', $order->id)->latest()->first();
        if (! $payment) {
            return;
        }

        if ($payment->isPaid() && $this->refundService && $order->user) {
            try {
                $this->refundService->create($payment, $order->user, (float) $payment->amount, $reason);
            } catch (\Throwable $e) {
                Log::error('Refund creation failed on order auto-cancellation: ' . $e->getMessage());
            }
        } elseif ($payment->status === PaymentStatus::PENDING || $payment->status === PaymentStatus::INITIATED) {
            $payment->update(['status' => PaymentStatus::FAILED]);
        }
    }
}
