<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Carbon\Carbon;
use DateTimeInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $assignment = $this->resource->relationLoaded('pickup_assignment')
            ? $this->resource->getRelation('pickup_assignment')
            : null;

        $isExchange = str_starts_with(
            mb_strtolower(trim((string) $this->review_notes)),
            'approved as exchange:'
        );

        $statusValue = $this->status instanceof \BackedEnum
            ? $this->status->value
            : (string) $this->status;

        $isRefund = in_array($statusValue, ['refund_pending', 'refunded'], true)
            || (int) ($this->refunds_count ?? 0) > 0;

        $collectedAt = $this->pickup_collected_at;
        if (empty($collectedAt) && preg_match('/\[PICKUP_COLLECTED:([^:\]]+)/', (string) $this->review_notes, $matches)) {
            $collectedAt = $matches[1];
        }

        $collectedAtIso = null;
        if ($collectedAt instanceof DateTimeInterface) {
            $collectedAtIso = $collectedAt->toISOString();
        } elseif (! empty($collectedAt)) {
            try {
                $collectedAtIso = Carbon::parse($collectedAt)->toISOString();
            } catch (\Throwable) {
                $collectedAtIso = (string) $collectedAt;
            }
        }

        $createdAtIso = $this->created_at instanceof DateTimeInterface
            ? $this->created_at->toISOString()
            : ($this->created_at ? Carbon::parse($this->created_at)->toISOString() : null);

        $updatedAtIso = $this->updated_at instanceof DateTimeInterface
            ? $this->updated_at->toISOString()
            : ($this->updated_at ? Carbon::parse($this->updated_at)->toISOString() : null);

        return [
            'id' => $this->uuid,
            'return_number' => $this->return_number,
            'type' => $isExchange ? 'exchange' : ($isRefund ? 'refund' : 'return'),
            'status' => $statusValue,
            'order_number' => $this->order?->order_number,
            'vendor_order_number' => $this->vendorOrder?->vendor_order_number,
            'product_name' => $this->orderItem?->product_name,
            'quantity' => (int) $this->quantity,
            'reason' => $this->reason,
            'pickup_address' => $assignment?->dropoff_address,
            'dropoff_address' => $assignment?->pickup_address,
            'recipient_name' => $assignment?->recipient_name,
            'recipient_phone' => $assignment?->recipient_phone,
            'pickup_collected_at' => $collectedAtIso,
            'created_at' => $createdAtIso,
            'updated_at' => $updatedAtIso,
        ];
    }
}
