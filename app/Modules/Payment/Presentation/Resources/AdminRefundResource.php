<?php

namespace App\Modules\Payment\Presentation\Resources;

use App\Modules\Identity\Presentation\Resources\UserResource;
use App\Modules\Order\Presentation\Resources\OrderItemResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminRefundResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'refund_number' => $this->refund_number,
            'payment_id' => $this->payment?->uuid,
            'payment_number' => $this->payment?->payment_number,
            'order_id' => $this->order?->uuid,
            'order_number' => $this->order?->order_number,
            'customer' => new UserResource($this->whenLoaded('order.user')),
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->payment?->currency ?? 'NPR',
            'status' => $this->status->value,
            'reason' => $this->reason,
            'provider_refund_id' => $this->provider_refund_id,
            'order_item' => $this->orderItem ? [
                'id' => $this->orderItem->uuid,
                'product_name' => $this->orderItem->product_name,
                'sku' => $this->orderItem->sku,
                'image' => $this->orderItem->image,
                'quantity' => $this->orderItem->quantity,
                'line_total' => number_format((float) $this->orderItem->line_total, 2, '.', ''),
            ] : null,
            'initiated_at' => $this->initiated_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
