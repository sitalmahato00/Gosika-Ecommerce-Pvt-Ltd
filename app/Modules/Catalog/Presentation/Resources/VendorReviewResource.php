<?php

namespace App\Modules\Catalog\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $type = $this->review_type ?? ($this->product_id !== null ? 'product' : 'store');

        return [
            'id' => $this->uuid,
            'type' => $type,
            'rating' => $this->rating,
            'title' => $type === 'product' ? $this->title ?? null : null,
            'body' => $this->body,
            'status' => $this->status->value,
            'customer' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->uuid,
                'full_name' => $this->user?->full_name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
            ]),
            'product_name' => $type === 'product' ? $this->product?->name : $this->store?->name,
            'image' => $this->product?->primaryImage?->file_path,
            'reply' => $this->reply,
            'replied_at' => $this->replied_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
