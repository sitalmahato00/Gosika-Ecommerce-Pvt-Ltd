<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;

class DeliveryAssignedMail extends BrandedMail
{
    public function __construct(
        public DeliveryAssignment $assignment,
    ) {
    }

    public function build(): static
    {
        $assignment = $this->assignment->loadMissing(['deliveryPartner', 'vendorOrder.order', 'vendorOrder.store']);

        return $this
            ->subject('New delivery assignment — '.($assignment->vendorOrder?->vendor_order_number ?? ''))
            ->sendBranded('mail.emails.delivery-assigned', [
                'assignment' => $assignment,
                'partnerName' => (string) ($assignment->deliveryPartner?->name ?? 'there'),
                'vendorOrderNumber' => (string) ($assignment->vendorOrder?->vendor_order_number ?? ''),
                'orderNumber' => (string) ($assignment->vendorOrder?->order?->order_number ?? ''),
                'pickup' => (string) ($assignment->pickup_address ?? ''),
                'dropoff' => (string) ($assignment->dropoff_address ?? ''),
                'recipientName' => (string) ($assignment->recipient_name ?? ''),
                'recipientPhone' => (string) ($assignment->recipient_phone ?? ''),
                'hasCod' => (float) ($assignment->cod_amount ?? 0) > 0,
                'codAmount' => MailBrand::money((float) ($assignment->cod_amount ?? 0)),
                'deliveryFee' => MailBrand::money((float) ($assignment->delivery_fee ?? 0)),
            ]);
    }
}