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
            'image' => $this->resolveImage($this->image),
            'quantity' => $this->quantity,
            'unit_price' => number_format((float) $this->unit_price, 2, '.', ''),
            'line_total' => number_format((float) $this->line_total, 2, '.', ''),
            'delivery_status' => $this->delivery_status->value,
        ];
    }

    protected function resolveImage(?string $image): ?string
    {
        if (! $image) {
            return null;
        }

        if (str_starts_with($image, 'http://') || str_starts_with($image, 'https://') || str_starts_with($image, 'data:')) {
            return $image;
        }

        if (str_starts_with($image, '/storage/')) {
            return url($image);
        }

        if (str_starts_with($image, 'storage/')) {
            return url('/'.$image);
        }

        return url('/storage/'.$image);
    }
}
