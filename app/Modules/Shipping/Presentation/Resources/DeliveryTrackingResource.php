<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryTrackingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $address = json_decode((string) $this->vendorOrder?->order?->shipping_address_snapshot, true) ?: [];
        $locationZone = collect([
            $address['municipality'] ?? null,
            $address['district'] ?? null,
            $address['province'] ?? null,
        ])->filter()->unique()->implode(', ');

        [$title, $description] = match ($this->status->value) {
            'assigned' => ['Courier assigned', 'A delivery partner has been assigned to your order.'],
            'accepted' => ['Delivery accepted', 'Your delivery partner has accepted the delivery.'],
            'picked_up' => ['Package picked up', 'Your package has been picked up from the seller.'],
            'out_for_delivery' => ['Out for delivery', 'Your package is on its way to your delivery address.'],
            'delivered' => ['Delivered successfully', 'Your package was handed over and delivery was confirmed.'],
            'failed' => ['Delivery attempt unsuccessful', $this->note ?: 'The delivery partner could not complete this delivery attempt.'],
            'returned_to_vendor' => ['Returned to seller', $this->note ?: 'The package was returned to the seller.'],
            default => ['Order received', $this->note ?: 'Your order is being prepared for delivery.'],
        };

        return [
            'id' => $this->uuid,
            'assignment_id' => $this->assignment?->uuid,
            'vendor_order_id' => $this->vendorOrder?->uuid,
            'status' => $this->status->value,
            'title' => $title,
            'description' => $description,
            'location_zone' => $locationZone ?: null,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'note' => $this->note,
            'tracked_at' => $this->tracked_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
