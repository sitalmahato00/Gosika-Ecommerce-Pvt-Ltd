<?php

namespace App\Modules\Payment\Presentation\Resources;

use App\Modules\Identity\Presentation\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'payment_number' => $this->payment_number,
            'order_id' => $this->order?->uuid,
            'order_number' => $this->order?->order_number,
            'customer' => new UserResource($this->whenLoaded('user')),
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->currency,
            'method' => $this->method,
            'provider' => $this->provider,
            'status' => $this->status->value,
            'provider_pidx' => $this->provider_pidx,
            'provider_transaction_id' => $this->provider_transaction_id,
            'payer_name' => $this->payer_name,
            'payer_email' => $this->payer_email,
            'payer_phone' => $this->payer_phone,
            'initiated_at' => $this->initiated_at?->toISOString(),
            'verified_at' => $this->verified_at?->toISOString(),
            'expires_at' => $this->expires_at?->toISOString(),
            'refunds' => AdminRefundResource::collection($this->whenLoaded('refunds')),
            'attempts' => $this->whenLoaded('attempts', fn () => $this->attempts->map(fn ($a) => [
                'attempt_number' => $a->attempt_number,
                'status' => $a->status->value,
                'initiated_at' => $a->initiated_at?->toISOString(),
                'completed_at' => $a->completed_at?->toISOString(),
            ])),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
