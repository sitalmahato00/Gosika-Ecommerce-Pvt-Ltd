<?php

namespace App\Modules\Order\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'vendor_order_number' => $this->vendor_order_number,
            'vendor_id' => $this->vendor?->uuid,
            'vendor_name' => $this->vendor?->company_name,
            'store_id' => $this->store?->uuid,
            'store_name' => $this->store?->name,
            'status' => $this->status->value,
            'delivery_status' => $this->delivery_status->value,
            'items_subtotal' => number_format((float) $this->items_subtotal, 2, '.', ''),
            'delivery_charge' => number_format((float) $this->delivery_charge, 2, '.', ''),
            'tax' => number_format((float) $this->tax, 2, '.', ''),
            'grand_total' => number_format((float) $this->grand_total, 2, '.', ''),
            'commission_rate' => (float) $this->commission_rate,
            'commission_amount' => number_format((float) $this->commission_amount, 2, '.', ''),
            'vendor_payable' => number_format((float) $this->vendor_payable, 2, '.', ''),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
