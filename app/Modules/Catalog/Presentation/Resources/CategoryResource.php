<?php

namespace App\Modules\Catalog\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'parent_id' => $this->when($this->parent, fn () => $this->parent->uuid),
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'image' => $this->image,
            'status' => $this->status,
            'sort_order' => $this->sort_order,
            'products_count' => $this->when(isset($this->products_count), $this->products_count),
            'children' => $this->when($this->relationLoaded('children'), fn () => self::collection($this->children)),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
