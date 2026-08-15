<?php

namespace App\Modules\Marketplace\Presentation\Resources;

use App\Modules\Catalog\Presentation\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecentlyViewedResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'product' => new ProductResource($this->product),
            'viewed_at' => $this->viewed_at?->toISOString(),
        ];
    }
}
