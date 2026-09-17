<?php

namespace App\Modules\Vendor\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KycResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'owner_full_name' => $this->owner_full_name,
            'owner_citizenship_number' => $this->owner_citizenship_number,
            'owner_email' => $this->owner_email,
            'owner_phone' => $this->owner_phone,
            'business_type' => $this->business_type,
            'address' => $this->address,
            'province' => $this->province,
            'district' => $this->district,
            'municipality' => $this->municipality,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'status' => $this->status,
            'review_notes' => $this->review_notes,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
        ];
    }
}
