<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MyQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'question' => $this->question,
            'answer' => $this->answer,
            'status' => $this->status->value,
            'answered_at' => $this->answered_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'product' => $this->product ? [
                'id' => $this->product->uuid,
                'name' => $this->product->name,
                'image' => $this->product->primaryImage
                    ? url('/storage/'.$this->product->primaryImage->file_path)
                    : null,
            ] : null,
        ];
    }
}