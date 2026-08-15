<?php

namespace App\Modules\Wallet\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SettlementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'settlement_number' => $this->settlement_number,
            'vendor_id' => $this->vendor?->uuid,
            'period_start' => $this->period_start?->toDateString(),
            'period_end' => $this->period_end?->toDateString(),
            'gross_sales' => number_format((float) $this->gross_sales, 2, '.', ''),
            'commission_total' => number_format((float) $this->commission_total, 2, '.', ''),
            'refunds_total' => number_format((float) $this->refunds_total, 2, '.', ''),
            'adjustments_total' => number_format((float) $this->adjustments_total, 2, '.', ''),
            'net_payable' => number_format((float) $this->net_payable, 2, '.', ''),
            'status' => $this->status->value,
            'generated_at' => $this->generated_at?->toISOString(),
            'paid_at' => $this->paid_at?->toISOString(),
            'payout_requests' => $this->whenLoaded('payoutRequests', fn () => $this->payoutRequests->map(fn ($p) => [
                'id' => $p->uuid,
                'payout_number' => $p->payout_number,
                'amount' => number_format((float) $p->amount, 2, '.', ''),
                'status' => $p->status->value,
            ])),
        ];
    }
}
