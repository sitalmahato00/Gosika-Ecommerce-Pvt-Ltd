<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MyReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'rating' => $this->rating,
            'title' => $this->title,
            'body' => $this->body,
            'status' => $this->status->value,
            'reply' => $this->reply,
            'product_id' => $this->product?->uuid,
            'product_name' => $this->product?->name,
            'image' => $this->product?->primaryImage
                ? url('/storage/'.$this->product->primaryImage->file_path)
                : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}