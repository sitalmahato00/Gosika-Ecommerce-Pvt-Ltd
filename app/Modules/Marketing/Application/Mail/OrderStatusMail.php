<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use App\Modules\Order\Infrastructure\Models\Order;
use Illuminate\Support\Str;

class OrderStatusMail extends BrandedMail
{
    public function __construct(
        public Order $order,
        public string $status,
        public string $headline,
        public string $message,
    ) {
    }

    public function build(): static
    {
        $order = $this->order->loadMissing(['items', 'user']);
        $shippingAddress = $order->shipping_address_snapshot;
        if (is_string($shippingAddress)) {
            $shippingAddress = json_decode($shippingAddress, true) ?: [];
        }

        return $this
            ->subject($this->headline.' — Order '.$order->order_number)
            ->sendBranded('mail.emails.order-status', [
                'order' => $order,
                'items' => $order->items,
                'status' => $this->status,
                'headline' => $this->headline,
                'bodyMessage' => $this->message,
                'paymentMethod' => Str::headline((string) $order->payment_method),
                'paymentStatus' => Str::headline(str_replace('_', ' ', (string) $order->payment_status?->value)),
                'statusLabel' => Str::headline(str_replace('_', ' ', $this->status)),
                'placedAt' => $order->placed_at?->format('M d, Y g:i A'),
                'subtotal' => MailBrand::money((float) $order->subtotal),
                'discount' => MailBrand::money((float) $order->discount),
                'deliveryCharge' => MailBrand::money((float) $order->delivery_charge),
                'tax' => MailBrand::money((float) $order->tax),
                'total' => MailBrand::money((float) $order->grand_total),
                'shippingAddress' => is_array($shippingAddress) ? $shippingAddress : [],
                'trackUrl' => MailBrand::url('account/orders/'.$order->uuid),
            ]);
    }
}