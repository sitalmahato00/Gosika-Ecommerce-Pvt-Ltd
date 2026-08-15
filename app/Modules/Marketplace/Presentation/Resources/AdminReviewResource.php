<?php

namespace App\Modules\Marketplace\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $type = $this->review_type ?? ($this->product_id !== null ? 'product' : 'store');

        return [
            'id' => $this->uuid,
            'type' => $type,
            'rating' => $this->rating,
            'title' => $this->title ?? null,
            'body' => $this->body,
            'status' => $this->status->value,
            'verified_buyer' => $this->vendor_order_item_id !== null || $this->vendor_order_id !== null,
            'customer' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->uuid,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ]),
            'target' => $type === 'product'
                ? [
                    'id' => $this->product?->uuid,
                    'name' => $this->product?->name,
                    'image' => $this->product?->primaryImage?->file_path,
                ]
                : [
                    'id' => $this->store?->uuid,
                    'name' => $this->store?->name,
                ],
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
