<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CourierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'code' => $this->code,
            'logo' => $this->logo,
            'contact_phone' => $this->contact_phone,
            'contact_email' => $this->contact_email,
            'tracking_url_pattern' => $this->tracking_url_pattern,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
