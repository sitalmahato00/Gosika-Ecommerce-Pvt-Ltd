<?php

namespace App\Modules\Order\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'product_id' => $this->product?->uuid,
            'product_name' => $this->product_name,
            'sku' => $this->sku,
            'variant_name' => $this->variant_name,
            'image' => $this->image ? url('/storage/'.$this->image) : null,
            'quantity' => $this->quantity,
            'unit_price' => number_format((float) $this->unit_price, 2, '.', ''),
            'line_total' => number_format((float) $this->line_total, 2, '.', ''),
            'delivery_status' => $this->delivery_status->value,
        ];
    }
}
