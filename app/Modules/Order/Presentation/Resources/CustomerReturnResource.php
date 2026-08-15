<?php

namespace App\Modules\Order\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'return_number' => $this->return_number,
            'reason_type' => $this->reason_type,
            'reason' => $this->reason,
            'quantity' => $this->quantity,
            'refund_amount' => number_format((float) $this->refund_amount, 2, '.', ''),
            'status' => $this->status->value,
            'response' => $this->review_notes,
            'product_name' => $this->orderItem?->product_name,
            'product_image' => $this->orderItem?->image,
            'order_id' => $this->order?->uuid,
            'order_number' => $this->order?->order_number,
            'created_at' => $this->created_at?->toISOString(),
            'reviewed_at' => $this->reviewed_at?->toISOString(),
        ];
    }
}
