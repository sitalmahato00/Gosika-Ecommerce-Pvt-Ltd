<?php

namespace App\Modules\Order\Presentation\Resources;

use App\Modules\Order\Presentation\Http\Requests\CancelOrderRequest;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $shipping = $this->shipping_address_snapshot ? json_decode($this->shipping_address_snapshot, true) : null;

        $placedAt = Carbon::parse($this->placed_at ?? $this->created_at);
        $cancellationWindowMins = (int) Setting::get('order.cancellation_window_minutes', 15);
        $cancellationDeadline = $placedAt->copy()->addMinutes($cancellationWindowMins);

        $now = now();
        $isPending = in_array($this->status->value, [OrderStatus::PENDING->value, OrderStatus::PAYMENT_PENDING->value], true);
        $isWithinWindow = $now->lessThan($cancellationDeadline);
        $canCancel = $isPending && $isWithinWindow;

        $confirmedStatuses = [
            OrderStatus::CONFIRMED->value,
            OrderStatus::ACCEPTED->value,
            OrderStatus::PROCESSING->value,
            OrderStatus::PREPARING->value,
            OrderStatus::READY_FOR_PICKUP->value,
            OrderStatus::PICKED_UP->value,
            OrderStatus::OUT_FOR_DELIVERY->value,
            OrderStatus::DELIVERED->value,
            OrderStatus::COMPLETED->value,
        ];

        $blockedReason = null;
        if (in_array($this->status->value, $confirmedStatuses, true)) {
            $blockedReason = 'This order has been confirmed and can no longer be cancelled. Please contact support for assistance.';
        } elseif ($this->status === OrderStatus::CANCELLED) {
            $blockedReason = 'This order has already been cancelled.';
        } elseif ($isPending && ! $isWithinWindow) {
            $blockedReason = 'The cancellation window for this order has expired.';
        }

        $secondsRemaining = $isWithinWindow ? max(0, $now->diffInSeconds($cancellationDeadline, false)) : 0;

        return [
            'id' => $this->uuid,
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status->value,
            'subtotal' => number_format((float) $this->subtotal, 2, '.', ''),
            'discount' => number_format((float) $this->discount, 2, '.', ''),
            'delivery_charge' => number_format((float) $this->delivery_charge, 2, '.', ''),
            'tax' => number_format((float) $this->tax, 2, '.', ''),
            'grand_total' => number_format((float) $this->grand_total, 2, '.', ''),
            'currency' => $this->currency,
            'shipping_address' => $shipping,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'vendor_orders' => VendorOrderResource::collection($this->whenLoaded('vendorOrders')),
            'customer_notes' => $this->customer_notes,
            'placed_at' => $this->placed_at?->toISOString() ?? $this->created_at?->toISOString(),
            'confirmed_at' => $this->confirmed_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'cancelled_reason' => $this->cancelled_reason,
            'created_at' => $this->created_at?->toISOString(),
            // Cancellation rules & timers (Server authoritative)
            'can_cancel' => $canCancel,
            'cancellation_window_minutes' => $cancellationWindowMins,
            'cancellation_deadline' => $cancellationDeadline->toISOString(),
            'cancellation_seconds_remaining' => (int) $secondsRemaining,
            'cancellation_blocked_reason' => $blockedReason,
            'allowed_cancellation_reasons' => CancelOrderRequest::ALLOWED_REASONS,
        ];
    }
}
