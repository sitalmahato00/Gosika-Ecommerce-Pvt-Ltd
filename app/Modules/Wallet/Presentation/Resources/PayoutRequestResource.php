<?php

namespace App\Modules\Wallet\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayoutRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'payout_number' => $this->payout_number,
            'vendor_id' => $this->vendor?->uuid,
            'vendor_name' => $this->whenLoaded('vendor', fn () => $this->vendor?->company_name),
            'settlement_id' => $this->settlement?->uuid,
            'bank_account_id' => $this->bankAccount?->uuid,
            'bank_name' => $this->bankAccount?->bank_name,
            'account_number' => $this->bankAccount?->account_number ? substr($this->bankAccount->account_number, -4) : null,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'status' => $this->status->value,
            'requested_at' => $this->requested_at?->toISOString(),
            'approved_at' => $this->approved_at?->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
            'rejection_reason' => $this->rejection_reason,
            'records' => $this->whenLoaded('records', fn () => $this->records->map(fn ($r) => [
                'provider_reference' => $r->provider_reference,
                'amount' => number_format((float) $r->amount, 2, '.', ''),
                'fee' => number_format((float) $r->fee, 2, '.', ''),
                'net_amount' => number_format((float) $r->net_amount, 2, '.', ''),
                'status' => $r->status,
                'paid_at' => $r->paid_at?->toISOString(),
            ])),
        ];
    }
}
