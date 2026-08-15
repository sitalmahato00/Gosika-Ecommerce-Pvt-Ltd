<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShippingZoneResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'description' => $this->description,
            'provinces' => $this->provinces,
            'standard_charge' => number_format((float) $this->standard_charge, 2, '.', ''),
            'express_charge' => number_format((float) $this->express_charge, 2, '.', ''),
            'estimated_days' => $this->estimated_days,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
