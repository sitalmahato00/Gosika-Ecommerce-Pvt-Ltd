<?php

namespace App\Modules\Cart\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'product_id' => $this->when($this->product, $this->product->uuid),
            'name' => $this->when($this->product, $this->product->name),
            'sku' => $this->when($this->product, $this->variant?->sku ?? $this->product->sku),
            'variant_id' => $this->variant?->uuid,
            'variant_name' => $this->variant?->name,
            'options' => $this->variant?->options ?: $this->options,
            'image' => $this->when($this->product, fn () => $this->product->primaryImage?->file_path ?? $this->variant?->image),
            'unit_price' => $this->unit_price,
            'quantity' => $this->quantity,
            'total_price' => $this->total_price,
            'stock_status' => $this->when($this->variant, $this->variant?->stock_status) ?? $this->when($this->product, $this->product->stock_status),
            'store' => $this->when($this->product?->store, fn () => [
                'id' => $this->product->store->uuid,
                'name' => $this->product->store->name,
            ]),
            'vendor_name' => $this->when($this->product?->vendor, $this->product->vendor->company_name),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
