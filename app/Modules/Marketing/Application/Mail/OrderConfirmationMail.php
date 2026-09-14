<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use App\Modules\Order\Infrastructure\Models\Order;
use Illuminate\Support\Str;

class OrderConfirmationMail extends BrandedMail
{
    public function __construct(
        public Order $order,
    ) {
    }

    public function build(): static
    {
        $order = $this->order->loadMissing(['items', 'vendorOrders']);

        return $this
            ->subject('Order '.$order->order_number.' confirmed')
            ->sendBranded('mail.emails.order-confirmation', [
                'order' => $order,
                'items' => $order->items,
                'billingName' => Str::title((string) ($order->user?->full_name ?: 'Valued Customer')),
                'methodLabel' => strtoupper((string) $order->payment_method),
                'statusLabel' => Str::title(str_replace('_', ' ', (string) $order->status?->value)),
                'total' => MailBrand::money((float) $order->grand_total),
                'orderUrl' => MailBrand::url('account/orders/'.$order->uuid),
            ]);
    }
}