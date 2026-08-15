<?php

namespace App\Modules\Marketing\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorCouponResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'code' => $this->code,
            'description' => $this->description,
            'type' => $this->discount_type->value,
            'value' => number_format((float) $this->discount_value, 2, '.', ''),
            'min_order' => number_format((float) $this->min_order_amount, 2, '.', ''),
            'max_discount' => $this->max_discount !== null ? number_format((float) $this->max_discount, 2, '.', '') : null,
            'usage_limit' => $this->usage_limit,
            'used_count' => $this->used_count,
            'start_date' => $this->valid_from?->format('Y-m-d'),
            'end_date' => $this->valid_until?->format('Y-m-d'),
            'status' => ! $this->is_active
                ? 'expired'
                : ($this->valid_from && $this->valid_from->isFuture() ? 'scheduled' : 'active'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
