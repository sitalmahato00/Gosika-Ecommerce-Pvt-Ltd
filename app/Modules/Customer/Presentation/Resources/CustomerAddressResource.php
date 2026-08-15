<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerAddressResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'address_type' => $this->address_type,
            'label' => $this->label,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'address_line_1' => $this->address_line_1,
            'address_line_2' => $this->address_line_2,
            'country' => $this->whenLoaded('country') && $this->country ? [
                'id' => $this->country->uuid,
                'name' => $this->country->name,
            ] : null,
            'province' => $this->whenLoaded('province') && $this->province ? [
                'id' => $this->province->uuid,
                'name' => $this->province->name,
            ] : null,
            'district' => $this->whenLoaded('district') && $this->district ? [
                'id' => $this->district->uuid,
                'name' => $this->district->name,
            ] : null,
            'municipality' => $this->whenLoaded('municipality') && $this->municipality ? [
                'id' => $this->municipality->uuid,
                'name' => $this->municipality->name,
            ] : null,
            'postal_code' => $this->postal_code,
            'landmark' => $this->landmark,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'is_default' => $this->is_default,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
