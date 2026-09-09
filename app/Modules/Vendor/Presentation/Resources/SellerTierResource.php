<?php

namespace App\Modules\Vendor\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SellerTierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'badge_level' => $this->badge_level,
            'min_orders' => $this->min_orders,
            'min_gmv' => (float) $this->min_gmv,
            'commission_percent' => $this->commission_percent !== null ? (float) $this->commission_percent : null,
            'badge_color' => $this->badge_color,
            'badge_icon' => $this->badge_icon,
            'description' => $this->description,
            'benefits' => $this->benefits,
            'sort_order' => $this->sort_order,
            'is_active' => (bool) $this->is_active,
            'vendor_count' => $this->vendors_count ?? 0,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}