<?php

namespace App\Modules\Checkout\Application\Services;

use App\Modules\Cart\Application\Services\CartService;
use App\Modules\Cart\Infrastructure\Models\Cart;
use App\Modules\Cart\Infrastructure\Models\CartItem;
use App\Modules\Checkout\Infrastructure\Models\CheckoutSession;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(protected CartService $cartService)
    {
    }

    public function summary(User $user, ?array $selectedItemUuids = null): array
    {
        $cart = $this->cartService->getCart($user);
        $items = $cart->items;

        if (!empty($selectedItemUuids) && is_array($selectedItemUuids)) {
            $filtered = $items->whereIn('uuid', $selectedItemUuids);
            if ($filtered->isNotEmpty()) {
                $items = $filtered;
            }
        }

        $subtotal = (float) $items->sum(fn (CartItem $item) => $item->total_price);
        $tax = $this->taxFor($items);
        $deliveryCharge = $this->deliveryChargeForItems($items);
        $discount = 0.0;
        $total = round($subtotal - $discount + $deliveryCharge + $tax, 2);

        return [
            'cart_id' => $cart->id,
            'item_count' => (int) $items->sum('quantity'),
            'subtotal' => $subtotal,
            'discount' => $discount,
            'delivery_charge' => $deliveryCharge,
            'tax' => $tax,
            'total' => $total,
        ];
    }

    public function create(User $user, array $data): CheckoutSession
    {
        $cart = $this->cartService->getCart($user);

        if ($cart->items->isEmpty()) {
            throw new DomainException('Your cart is empty.', 422);
        }

        $selectedItemUuids = isset($data['item_ids']) && is_array($data['item_ids'])
            ? array_values(array_filter($data['item_ids']))
            : null;

        $shippingAddress = $this->ownedAddress($user, $data['shipping_address_id']);

        if (! $shippingAddress) {
            throw new DomainException('Shipping address not found.', 422);
        }
        $billingAddress = isset($data['billing_address_id'])
            ? $this->ownedAddress($user, $data['billing_address_id'])
            : $shippingAddress;

        if (! $billingAddress) {
            $billingAddress = $shippingAddress;
        }

        $summary = $this->summary($user, $selectedItemUuids);
        $codSetting = Setting::get('checkout.cod_enabled') ?? Setting::get('payment.cod_enabled') ?? Setting::get('cod_enabled', 'true');
        $codEnabled = $codSetting === 'true' || $codSetting === true || $codSetting === 1 || $codSetting === '1';
        $maxCod = (float) (Setting::get('checkout.cod_max_amount') ?? Setting::get('payment.cod_max_amount', 100000));
        $minOrder = (float) Setting::get('checkout.min_order_amount', 0);
        $paymentMethod = $data['payment_method'] ?? PaymentMethod::COD->value;

        $khaltiEnabled = $this->isGatewayEnabled('khalti');
        $esewaEnabled = $this->isGatewayEnabled('esewa');

        if ($paymentMethod === PaymentMethod::KHALTI->value && ! $khaltiEnabled) {
            throw new DomainException('Khalti payment is currently unavailable.', 422);
        }

        if ($paymentMethod === PaymentMethod::ESEWA->value && ! $esewaEnabled) {
            throw new DomainException('eSewa payment is currently unavailable.', 422);
        }

        if ($paymentMethod === PaymentMethod::COD->value && ! $codEnabled) {
            throw new DomainException('Cash on delivery is currently unavailable.', 422);
        }

        if ($summary['total'] < $minOrder) {
            throw new DomainException('Minimum order amount is '.number_format($minOrder, 2).' NPR.', 422);
        }

        if ($paymentMethod === PaymentMethod::COD->value && $summary['total'] > $maxCod) {
            throw new DomainException('Order exceeds the maximum Cash on Delivery amount.', 422);
        }

        return DB::transaction(function () use ($user, $cart, $shippingAddress, $billingAddress, $summary, $data, $paymentMethod, $selectedItemUuids) {
            $session = new CheckoutSession();
            $session->user_id = $user->id;
            $session->cart_id = $cart->id;
            $session->shipping_address_id = $shippingAddress->id;
            $session->billing_address_id = $billingAddress->id;
            $session->payment_method = $paymentMethod;
            $session->subtotal = $summary['subtotal'];
            $session->discount = $summary['discount'];
            $session->delivery_charge = $summary['delivery_charge'];
            $session->tax = $summary['tax'];
            $session->total = $summary['total'];
            $session->status = 'pending';
            $session->meta = [
                'selected_item_ids' => $selectedItemUuids,
            ];
            $session->expires_at = now()->addMinutes((int) Setting::get('checkout.session_ttl_minutes', 30));
            $session->save();

            return $session->fresh(['cart.items.product', 'cart.items.variant', 'shippingAddress', 'billingAddress']);
        });
    }

    public function pendingFor(User $user, string $uuid): ?CheckoutSession
    {
        return CheckoutSession::query()
            ->forUser($user->id)
            ->where('uuid', $uuid)
            ->first();
    }

    protected function ownedAddress(User $user, string $uuid): ?CustomerAddress
    {
        return CustomerAddress::query()->forUser($user->id)->where('uuid', $uuid)->first();
    }

    protected function taxFor($items): float
    {
        $tax = 0.0;

        foreach ($items as $item) {
            $rate = (float) ($item->product?->tax_rate ?? 0);
            $tax += ((float) $item->total_price) * $rate / 100;
        }

        return round($tax, 2);
    }

    protected function deliveryChargeForItems($items): float
    {
        $charge = 0.0;

        foreach ($items->groupBy('product.vendor_id') as $group) {
            $subtotal = (float) $group->sum(fn (CartItem $item) => $item->total_price);
            $charge += $this->deliveryCharge($subtotal);
        }

        return round($charge, 2);
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

    protected function isGatewayEnabled(string $gateway): bool
    {
        $dbValue = Setting::get("payment.{$gateway}_enabled", 'false');
        if ($dbValue === 'true') {
            return true;
        }

        $secretKey = Setting::get("payment.{$gateway}_secret_key");
        if (! empty($secretKey)) {
            return true;
        }

        $configSecret = config("services.{$gateway}.secret_key", '');
        return ! empty($configSecret);
    }
}
