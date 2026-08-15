<?php

namespace App\Modules\Marketplace\Presentation\Resources;

use App\Modules\Catalog\Presentation\Resources\ProductResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WishlistResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'item_count' => $this->items->count(),
            'items' => $this->items->map(fn ($item) => [
                'id' => $item->uuid,
                'product_id' => $item->product->uuid,
                'product' => new ProductResource($item->product),
                'added_at' => $item->created_at?->toISOString(),
            ]),
        ];
    }
}
