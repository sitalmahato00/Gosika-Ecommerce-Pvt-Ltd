<?php

namespace App\Modules\Vendor\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo' => $this->logo,
            'banner' => $this->banner,
            'description' => $this->description,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'status' => $this->status,
            'settings' => $this->settings ?? [
                'order_confirmation_mode' => 'manual',
                'auto_ready_for_pickup' => false,
                'estimated_prep_time' => 'Same Day',
                'pickup_instructions' => '',
            ],
            'approved_at' => $this->approved_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
