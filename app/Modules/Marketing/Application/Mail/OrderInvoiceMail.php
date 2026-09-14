<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use App\Modules\Order\Infrastructure\Models\Order;
use Illuminate\Support\Str;

class OrderInvoiceMail extends BrandedMail
{
    public function __construct(
        public Order $order,
    ) {
    }

    public function build(): static
    {
        $order = $this->order->loadMissing(['items', 'vendorOrders.items', 'user']);

        $shippingAddress = json_decode((string) $order->shipping_address_snapshot, true) ?: [];

        $vendorRows = $order->vendorOrders->map(function ($vendorOrder) {
            return [
                'number' => $vendorOrder->vendor_order_number,
                'store' => $vendorOrder->store?->name ?? 'GOSIKA Marketplace',
                'item_count' => (int) $vendorOrder->items->count(),
                'subtotal' => MailBrand::money((float) $vendorOrder->items_subtotal),
                'delivery' => MailBrand::money((float) $vendorOrder->delivery_charge),
                'tax' => MailBrand::money((float) $vendorOrder->tax),
                'total' => MailBrand::money((float) $vendorOrder->grand_total),
            ];
        });

        return $this
            ->subject('Invoice for delivered order '.$order->order_number)
            ->sendBranded('mail.emails.order-invoice', [
                'order' => $order,
                'items' => $order->items,
                'customerName' => (string) ($order->user?->full_name ?: 'Valued Customer'),
                'addressLines' => array_filter([
                    $shippingAddress['address_line_1'] ?? null,
                    $shippingAddress['address_line_2'] ?? null,
                    $shippingAddress['municipality'] ?? null,
                    $shippingAddress['district'] ?? null,
                    $shippingAddress['province'] ?? null,
                    $shippingAddress['postal_code'] ?? null,
                ]),
                'deliveryName' => (string) ($shippingAddress['full_name'] ?? $order->user?->full_name ?? ''),
                'deliveryPhone' => (string) ($shippingAddress['phone'] ?? $order->user?->phone ?? ''),
                'methodLabel' => strtoupper((string) $order->payment_method),
                'subtotal' => MailBrand::money((float) $order->subtotal),
                'discount' => MailBrand::money((float) $order->discount),
                'delivery' => MailBrand::money((float) $order->delivery_charge),
                'tax' => MailBrand::money((float) $order->tax),
                'grandTotal' => MailBrand::money((float) $order->grand_total),
                'statusLabel' => Str::title(str_replace('_', ' ', (string) $order->status?->value)),
                'invoiceUrl' => MailBrand::url('account/orders/'.$order->uuid),
                'vendorRows' => $vendorRows,
            ]);
    }
}