<?php

namespace App\Modules\Catalog\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorInventoryItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'sku' => $this->sku,
            'category' => $this->category?->name,
            'price' => number_format((float) $this->price, 2, '.', ''),
            'stock' => $this->quantity,
            'reorder_level' => $this->low_stock_threshold,
            'stock_status' => $this->stock_status?->value,
            'total_sold' => (int) $this->total_sold,
            'cover_image' => $this->primaryImage?->file_path,
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
