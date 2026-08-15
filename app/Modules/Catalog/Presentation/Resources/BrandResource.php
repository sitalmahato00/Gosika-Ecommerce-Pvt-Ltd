<?php

namespace App\Modules\Catalog\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BrandResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo' => $this->logo,
            'description' => $this->description,
            'status' => $this->status,
            'products_count' => $this->when(isset($this->products_count), $this->products_count),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
