<?php

namespace App\Modules\Catalog\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BrandRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'brand_id' => $this->when($this->brand, fn () => $this->brand->uuid),
            'brand_name' => $this->brand_name,
            'reason' => $this->reason,
            'status' => $this->status,
            'review_notes' => $this->review_notes,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'vendor' => $this->when($this->relationLoaded('vendor'), fn () => [
                'id' => $this->vendor->uuid,
                'company_name' => $this->vendor->company_name,
            ]),
            'brand' => $this->when($this->relationLoaded('brand') && $this->brand, fn () => new BrandResource($this->brand)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
