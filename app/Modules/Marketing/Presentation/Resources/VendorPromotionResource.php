<?php

namespace App\Modules\Marketing\Presentation\Resources;

use App\Modules\Catalog\Infrastructure\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorPromotionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'tagline' => $this->tagline,
            'type' => $this->type,
            'discount_value' => number_format((float) $this->discount_value, 2, '.', ''),
            'banner_image' => $this->banner_image,
            'category' => $this->category,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'status' => $this->status,
            'participating_items' => Product::where('vendor_id', $this->vendor_id)->count(),
            'created_at' => $this->created_at?->toISOString(),
            'vendor' => $this->whenLoaded('vendor', fn () => [
                'id' => $this->vendor->uuid,
                'company_name' => $this->vendor->company_name,
                'status' => $this->vendor->status,
            ]),
        ];
    }
}
