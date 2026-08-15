<?php

namespace App\Modules\Marketplace\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicStoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reviews = $this->reviews ?? collect();
        $productCount = $this->products_count ?? 0;

        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo' => $this->logo ? url('/storage/'.$this->logo) : null,
            'banner' => $this->banner ? url('/storage/'.$this->banner) : null,
            'description' => $this->description,
            'product_count' => $productCount,
            'rating_avg' => $reviews->isNotEmpty() ? round($reviews->avg('rating'), 1) : null,
            'rating_count' => $reviews->count(),
            'location' => $this->whenLoaded('addresses', fn () => $this->addresses->first()?->address_line_1),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
