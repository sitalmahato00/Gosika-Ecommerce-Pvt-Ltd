<?php

namespace App\Modules\Marketplace\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'question' => $this->question,
            'answer' => $this->answer,
            'status' => $this->status->value,
            'customer' => $this->whenLoaded('user', fn () => $this->user?->full_name ?: $this->user?->first_name),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->uuid,
                'name' => $this->product?->name,
            ]),
            'answered_at' => $this->answered_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}