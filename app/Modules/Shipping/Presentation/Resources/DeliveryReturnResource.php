<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $assignment = $this->resource->getRelation('pickup_assignment');
        $isExchange = str_starts_with(
            mb_strtolower(trim((string) $this->review_notes)),
            'approved as exchange:'
        );
        $isRefund = in_array($this->status->value, ['refund_pending', 'refunded'], true)
            || (int) ($this->refunds_count ?? 0) > 0;

        return [
            'id' => $this->uuid,
            'return_number' => $this->return_number,
            'type' => $isExchange ? 'exchange' : ($isRefund ? 'refund' : 'return'),
            'status' => $this->status->value,
            'order_number' => $this->order?->order_number,
            'vendor_order_number' => $this->vendorOrder?->vendor_order_number,
            'product_name' => $this->orderItem?->product_name,
            'quantity' => (int) $this->quantity,
            'reason' => $this->reason,
            'pickup_address' => $assignment?->dropoff_address,
            'dropoff_address' => $assignment?->pickup_address,
            'recipient_name' => $assignment?->recipient_name,
            'recipient_phone' => $assignment?->recipient_phone,
            'pickup_collected_at' => $this->pickup_collected_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
