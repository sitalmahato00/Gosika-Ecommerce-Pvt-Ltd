<?php

namespace App\Modules\Marketing\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CampaignResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'title' => $this->title,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'image' => $this->image,
            'type' => $this->type,
            'target_type' => $this->target_type,
            'target_ids' => $this->target_ids,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value !== null ? number_format((float) $this->discount_value, 2, '.', '') : null,
            'min_order_amount' => $this->min_order_amount !== null ? number_format((float) $this->min_order_amount, 2, '.', '') : null,
            'status' => $this->status,
            'sort_order' => $this->sort_order,
            'start_date' => $this->start_date?->toISOString(),
            'end_date' => $this->end_date?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}