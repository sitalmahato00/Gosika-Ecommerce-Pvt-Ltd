<?php

namespace App\Modules\Order\Application\Services;

use App\Modules\Cart\Application\Services\CartService;
use App\Modules\Checkout\Infrastructure\Models\CheckoutSession;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\OrderStatusHistory;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Application\Services\WalletService;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function __construct(protected CartService $cartService, protected WalletService $walletService)
    {
    }

    public function listFor(User $user): Collection
    {
        return Order::query()
            ->where('user_id', $user->id)
            ->with(['items'])
            ->orderByDesc('created_at')
            ->get();
    }

    public function findFor(User $user, string $uuid): ?Order
    {
        return Order::query()
            ->where('user_id', $user->id)
            ->where('uuid', $uuid)
            ->with(['items', 'vendorOrders.items', 'shippingAddress'])
            ->first();
    }

    public function placeOrder(User $user, CheckoutSession $session, ?string $notes): Order
    {
        if ($session->status !== 'pending') {
            throw new DomainException('Checkout session is no longer valid.', 422);
        }

        $session->load(['cart.items.product.vendor', 'cart.items.product.store', 'cart.items.product.primaryImage', 'cart.items.variant', 'shippingAddress']);

        $cart = $session->cart;

        if (! $cart || $cart->items->isEmpty()) {
            throw new DomainException('Your cart is empty.', 422);
        }

        return DB::transaction(function () use ($user, $session, $cart, $notes) {
            foreach ($cart->items as $item) {
                $this->assertStock($item);
            }

            $order = $this->createOrder($user, $session, $cart, $notes);

            $vendorGroups = $cart->items->groupBy('product.vendor_id');
            $vendorDeliveryCharges = $this->vendorDeliveryCharges($cart->items);

            foreach ($vendorGroups as $vendorId => $group) {
                $this->createVendorOrder($order, (int) $vendorId, $group, $vendorDeliveryCharges);
            }

            $this->decrementStock($cart->items);

            OrderStatusHistory::create([
                'trackable_type' => Order::class,
                'trackable_id' => $order->id,
                'from_status' => null,
                'to_status' => $order->status->value,
                'reason' => $order->payment_method === 'cod'
                    ? 'Order placed via Cash on Delivery.'
                    : 'Order placed, awaiting '.strtoupper($order->payment_method).' payment.',
                'actor_user_id' => $user->id,
            ]);

            $session->update(['status' => 'completed']);

            $this->cartService->clear($user, null);

            return $order->fresh(['items', 'vendorOrders.items']);
        });
    }

    public function cancel(User $user, Order $order, ?string $reason): Order
    {
        if (! in_array($order->status->value, [OrderStatus::PENDING->value, OrderStatus::PAYMENT_PENDING->value, OrderStatus::CONFIRMED->value], true)) {
            throw new DomainException('Order cannot be cancelled in its current state.', 422);
        }

        if ($order->payment_status->value === OrderPaymentStatus::PAID->value) {
            throw new DomainException('Paid orders cannot be cancelled; request a return instead.', 422);
        }

        DB::transaction(function () use ($order, $user, $reason) {
            $from = $order->status->value;
            $order->status = OrderStatus::CANCELLED;
            $order->cancelled_at = now();
            $order->cancelled_reason = $reason;
            $order->cancelled_by = $user->id;
            $order->save();

            foreach ($order->vendorOrders as $vendorOrder) {
                $vendorOrder->update(['status' => OrderStatus::CANCELLED->value]);
            }

            $this->restoreStock($order);

            OrderStatusHistory::create([
                'trackable_type' => Order::class,
                'trackable_id' => $order->id,
                'from_status' => $from,
                'to_status' => OrderStatus::CANCELLED->value,
                'reason' => $reason,
                'actor_user_id' => $user->id,
            ]);
        });

        return $order->fresh(['items', 'vendorOrders.items']);
    }

    protected function createOrder(User $user, CheckoutSession $session, $cart, ?string $notes): Order
    {
        $order = new Order();
        $order->order_number = ReferenceNumber::unique('ORD');
        $order->user_id = $user->id;
        $order->checkout_session_id = $session->id;
        $order->shipping_address_id = $session->shipping_address_id;
        $order->shipping_address_snapshot = $this->addressSnapshot($session->shippingAddress);
        $order->payment_method = $session->payment_method;
        $order->payment_status = OrderPaymentStatus::PENDING;
        $order->status = in_array($session->payment_method, ['khalti', 'esewa'], true)
            ? OrderStatus::PAYMENT_PENDING
            : OrderStatus::PENDING;
        $order->subtotal = $session->subtotal;
        $order->discount = $session->discount;
        $order->delivery_charge = $session->delivery_charge;
        $order->tax = $session->tax;
        $order->grand_total = $session->total;
        $order->currency = 'NPR';
        $order->coupon_code = $session->coupon_code;
        $order->customer_notes = $notes;
        $order->placed_at = now();
        $order->save();

        return $order;
    }

    protected function createVendorOrder(Order $order, int $vendorId, $group, array $vendorDeliveryCharges): VendorOrder
    {
        $vendor = Vendor::query()->findOrFail($vendorId);

        $itemsSubtotal = (float) $group->sum(fn ($item) => $item->total_price);
        $discount = 0.0;
        $tax = 0.0;

        foreach ($group as $item) {
            $rate = (float) ($item->product?->tax_rate ?? 0);
            $tax += (float) $item->total_price * $rate / 100;
        }

        $deliveryCharge = $vendorDeliveryCharges[$vendorId] ?? 0.0;
        $grandTotal = round($itemsSubtotal - $discount + $deliveryCharge + $tax, 2);

        $commissionRate = $this->commissionRateFor($vendor);
        $commissionAmount = round($grandTotal * $commissionRate / 100, 2);

        $vendorOrder = new VendorOrder();
        $vendorOrder->vendor_order_number = ReferenceNumber::unique('VO');
        $vendorOrder->order_id = $order->id;
        $vendorOrder->vendor_id = $vendor->id;
        $vendorOrder->store_id = $group->first()->product->store_id;
        $vendorOrder->status = OrderStatus::PENDING;
        $vendorOrder->delivery_status = 'pending';
        $vendorOrder->items_subtotal = $itemsSubtotal;
        $vendorOrder->discount = $discount;
        $vendorOrder->delivery_charge = $deliveryCharge;
        $vendorOrder->tax = $tax;
        $vendorOrder->grand_total = $grandTotal;
        $vendorOrder->commission_rate = $commissionRate;
        $vendorOrder->commission_amount = $commissionAmount;
        $vendorOrder->vendor_payable = round($grandTotal - $commissionAmount, 2);
        $vendorOrder->save();

        foreach ($group as $item) {
            $orderItem = new OrderItem();
            $orderItem->order_id = $order->id;
            $orderItem->vendor_order_id = $vendorOrder->id;
            $orderItem->vendor_id = $vendor->id;
            $orderItem->product_id = $item->product_id;
            $orderItem->variant_id = $item->variant_id;
            $orderItem->product_name = $item->product?->name ?? 'Product';
            $orderItem->sku = $item->product?->sku;
            $orderItem->variant_name = $item->variant?->name;
            $orderItem->image = $item->product?->primaryImage?->file_path;
            $orderItem->quantity = $item->quantity;
            $orderItem->unit_price = $item->unit_price;
            $orderItem->unit_discount = 0;
            $orderItem->line_total = $item->total_price;
            $orderItem->delivery_status = 'pending';
            $orderItem->save();
        }

        $this->walletService->recordCommission($vendorOrder, $order->user_id);

        OrderStatusHistory::create([
            'trackable_type' => VendorOrder::class,
            'trackable_id' => $vendorOrder->id,
            'from_status' => null,
            'to_status' => OrderStatus::PENDING->value,
            'reason' => 'Order assigned to vendor.',
            'actor_user_id' => $order->user_id,
        ]);

        return $vendorOrder;
    }

    protected function commissionRateFor(Vendor $vendor): float
    {
        foreach (['commission.product_rate', 'commission.category_rate'] as $key) {
            $value = Setting::get($key);

            if ($this->present($value)) {
                return (float) $value;
            }
        }

        if ($this->present($vendor->commission_rate)) {
            return (float) $vendor->commission_rate;
        }

        return (float) Setting::get('commission.default_rate', 10);
    }

    protected function present(mixed $value): bool
    {
        return $value !== null && $value !== '' && $value !== 'null' && (float) $value != 0;
    }

    protected function vendorDeliveryCharges($items): array
    {
        $charges = [];

        foreach ($items->groupBy('product.vendor_id') as $vendorId => $group) {
            $subtotal = (float) $group->sum(fn ($item) => $item->total_price);
            $charges[$vendorId] = $this->deliveryCharge($subtotal);
        }

        return $charges;
    }

    protected function deliveryCharge(float $subtotal): float
    {
        $flat = (float) Setting::get('shipping.flat_charge', 80);
        $freeThreshold = (float) Setting::get('shipping.free_delivery_threshold', 2000);

        if ($freeThreshold > 0 && $subtotal >= $freeThreshold) {
            return 0.0;
        }

        return $flat;
    }

    protected function assertStock($item): void
    {
        $product = $item->product;
        $variant = $item->variant;

        if ($variant) {
            if ($variant->quantity !== null && $item->quantity > $variant->quantity) {
                throw new DomainException($product->name.' is out of stock.', 409);
            }
        } elseif ($product && $product->quantity !== null && $item->quantity > $product->quantity) {
            throw new DomainException($product->name.' is out of stock.', 409);
        }
    }

    protected function decrementStock($items): void
    {
        foreach ($items as $item) {
            $product = $item->product;
            $variant = $item->variant;

            if ($variant) {
                $variant->decrement('quantity', $item->quantity);
                $this->syncStockStatus($variant);
            }

            if ($product) {
                $product->decrement('quantity', $item->quantity);
                $this->syncStockStatus($product);
            }
        }
    }

    protected function restoreStock(Order $order): void
    {
        foreach ($order->items as $item) {
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

    protected function syncStockStatus($model): void
    {
        if ($model->quantity !== null && $model->quantity <= 0) {
            $model->stock_status = 'out_of_stock';
            $model->save();
        }
    }

    protected function addressSnapshot($address): ?string
    {
        if (! $address) {
            return null;
        }

        return json_encode([
            'full_name' => $address->full_name,
            'phone' => $address->phone,
            'address_line_1' => $address->address_line_1,
            'address_line_2' => $address->address_line_2,
            'district' => $address->district?->name,
            'province' => $address->province?->name,
            'municipality' => $address->municipality?->name,
            'postal_code' => $address->postal_code,
            'landmark' => $address->landmark,
        ], JSON_UNESCAPED_UNICODE);
    }
}
