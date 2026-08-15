<?php

namespace App\Modules\Catalog\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class VendorCustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->user;

        return [
            'id' => $user->uuid,
            'name' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'orders_count' => (int) $this->orders_count,
            'total_spent' => number_format((float) $this->total_spent, 2, '.', ''),
            'last_order_at' => $this->last_order_at ? Carbon::parse($this->last_order_at)->toISOString() : null,
        ];
    }
}
