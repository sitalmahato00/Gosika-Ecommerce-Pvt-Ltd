<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use App\Modules\Order\Infrastructure\Models\Order;

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
        $order = $this->order->loadMissing('items');

        return $this
            ->subject($this->headline.' — Order '.$order->order_number)
            ->sendBranded('mail.emails.order-status', [
                'order' => $order,
                'status' => $this->status,
                'headline' => $this->headline,
                'message' => $this->message,
                'trackUrl' => MailBrand::url('account/orders/'.$order->uuid),
            ]);
    }
}