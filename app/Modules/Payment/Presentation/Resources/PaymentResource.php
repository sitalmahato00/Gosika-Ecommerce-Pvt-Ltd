<?php

namespace App\Modules\Payment\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'payment_number' => $this->payment_number,
            'order_id' => $this->order?->uuid,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->currency,
            'method' => $this->method,
            'provider' => $this->provider,
            'status' => $this->status->value,
            'provider_pidx' => $this->provider_pidx,
            'provider_transaction_id' => $this->provider_transaction_id,
            'payment_url' => $this->provider_response['payment_url'] ?? null,
            'expires_at' => $this->expires_at?->toISOString(),
            'initiated_at' => $this->initiated_at?->toISOString(),
            'verified_at' => $this->verified_at?->toISOString(),
            'attempts' => $this->whenLoaded('attempts', fn () => $this->attempts->map(fn ($a) => [
                'attempt_number' => $a->attempt_number,
                'status' => $a->status->value,
                'initiated_at' => $a->initiated_at?->toISOString(),
                'completed_at' => $a->completed_at?->toISOString(),
            ])),
            'status_history' => $this->whenLoaded('statusHistory', fn () => $this->statusHistory->map(fn ($h) => [
                'from_status' => $h->from_status?->value,
                'to_status' => $h->to_status->value,
                'reason' => $h->reason,
                'created_at' => $h->created_at?->toISOString(),
            ])),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
