<?php

namespace App\Modules\Marketing\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'code' => $this->code,
            'name' => $this->name,
            'description' => $this->description,
            'discount_type' => $this->discount_type->value,
            'discount_value' => number_format((float) $this->discount_value, 2, '.', ''),
            'min_order_amount' => number_format((float) $this->min_order_amount, 2, '.', ''),
            'max_discount' => $this->max_discount !== null ? number_format((float) $this->max_discount, 2, '.', '') : null,
            'usage_limit' => $this->usage_limit,
            'per_user_limit' => $this->per_user_limit,
            'used_count' => $this->used_count,
            'valid_from' => $this->valid_from?->toISOString(),
            'valid_until' => $this->valid_until?->toISOString(),
            'is_active' => $this->is_active,
            'applies_to' => $this->applies_to,
            'applies_to_ids' => $this->applies_to_ids,
            'is_first_order_only' => $this->is_first_order_only,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
