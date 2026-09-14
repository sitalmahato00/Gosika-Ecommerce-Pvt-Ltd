<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use Illuminate\Support\Str;

class VendorNewOrderMail extends BrandedMail
{
    public function __construct(
        public VendorOrder $vendorOrder,
    ) {
    }

    public function build(): static
    {
        $vendorOrder = $this->vendorOrder->loadMissing(['items', 'store', 'order.user']);

        $order = $vendorOrder->order;

        return $this
            ->subject('New order '.$vendorOrder->vendor_order_number.' from '.$order->order_number)
            ->sendBranded('mail.emails.vendor-new-order', [
                'vendorOrder' => $vendorOrder,
                'items' => $vendorOrder->items,
                'storeName' => $vendorOrder->store?->name ?? 'Your store',
                'orderNumber' => (string) $order->order_number,
                'customerName' => (string) ($order->user?->full_name ?: 'Valued Customer'),
                'customerPhone' => (string) ($order->user?->phone ?? ''),
                'paymentMethod' => strtoupper((string) $order->payment_method),
                'subtotal' => MailBrand::money((float) $vendorOrder->items_subtotal),
                'delivery' => MailBrand::money((float) $vendorOrder->delivery_charge),
                'tax' => MailBrand::money((float) $vendorOrder->tax),
                'commission' => MailBrand::money((float) $vendorOrder->commission_amount),
                'netPayable' => MailBrand::money((float) $vendorOrder->vendor_payable),
                'orderUrl' => MailBrand::url('vendor/orders/'.$vendorOrder->uuid),
                'statusLabel' => Str::title(str_replace('_', ' ', (string) $vendorOrder->status?->value)),
            ]);
    }
}