<?php

namespace App\Modules\Marketplace\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'status' => $this->status->value,
            'user' => $this->whenLoaded('user', fn () => [
                'name' => $this->user?->name,
            ]),
            'product_id' => $this->product?->uuid,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
