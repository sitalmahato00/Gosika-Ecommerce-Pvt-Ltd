<?php

namespace App\Modules\Marketplace\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'question' => $this->question,
            'answer' => $this->answer,
            'status' => $this->status->value,
            'customer' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->uuid,
                'name' => $this->user?->full_name ?: $this->user?->first_name,
                'email' => $this->user?->email,
            ]),
            'target' => $this->whenLoaded('product', fn () => [
                'id' => $this->product?->uuid,
                'name' => $this->product?->name,
                'image' => $this->product?->primaryImage?->file_path,
            ]),
            'answered_by' => $this->whenLoaded('answeredBy', fn () => $this->answeredBy?->full_name ?: $this->answeredBy?->first_name),
            'answered_at' => $this->answered_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}