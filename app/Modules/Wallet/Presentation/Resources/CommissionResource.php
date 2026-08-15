<?php

namespace App\Modules\Wallet\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'order_id' => $this->order?->uuid,
            'vendor_order_id' => $this->vendor_order_id,
            'rate' => number_format((float) $this->rate, 2, '.', ''),
            'basis_amount' => number_format((float) $this->basis_amount, 2, '.', ''),
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'status' => $this->status->value,
            'calculated_at' => $this->calculated_at?->toISOString(),
            'adjusted_at' => $this->adjusted_at?->toISOString(),
            'adjustment_reason' => $this->adjustment_reason,
        ];
    }
}
