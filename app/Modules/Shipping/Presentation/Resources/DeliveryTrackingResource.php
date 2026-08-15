<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryTrackingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'assignment_id' => $this->assignment?->uuid,
            'vendor_order_id' => $this->vendorOrder?->uuid,
            'status' => $this->status->value,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'note' => $this->note,
            'tracked_at' => $this->tracked_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
