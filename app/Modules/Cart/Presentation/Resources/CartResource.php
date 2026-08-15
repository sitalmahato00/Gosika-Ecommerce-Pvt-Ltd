<?php

namespace App\Modules\Cart\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $items = $this->items ?? collect();

        return [
            'id' => $this->uuid,
            'status' => $this->status,
            'item_count' => $items->sum('quantity'),
            'line_count' => $items->count(),
            'subtotal' => number_format((float) $items->sum(fn ($i) => $i->total_price), 2, '.', ''),
            'items' => CartItemResource::collection($items),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
