<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PendingReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'product_id' => $this->product?->uuid,
            'product_name' => $this->product?->name ?: $this->product_name,
            'image' => $this->product?->primaryImage
                ? url('/storage/'.$this->product->primaryImage->file_path)
                : ($this->image ? url('/storage/'.$this->image) : null),
            'quantity' => $this->quantity,
            'unit_price' => number_format((float) $this->unit_price, 2, '.', ''),
            'delivery_status' => $this->delivery_status?->value,
            'order_id' => $this->order?->uuid,
            'order_number' => $this->order?->order_number,
            'placed_at' => $this->order?->placed_at?->toISOString(),
        ];
    }
}