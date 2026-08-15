<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryPartnerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'user_id' => $this->user?->uuid,
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'vehicle_type' => $this->vehicle_type,
            'vehicle_number' => $this->vehicle_number,
            'service_areas' => $this->service_areas,
            'status' => $this->status->value,
            'is_online' => (bool) $this->is_online,
            'rating_avg' => (float) $this->rating_avg,
            'rating_count' => (int) $this->rating_count,
            'latitude' => $this->latitude !== null ? (float) $this->latitude : null,
            'longitude' => $this->longitude !== null ? (float) $this->longitude : null,
            'last_location_at' => $this->last_location_at?->toISOString(),
            'approved_at' => $this->approved_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
