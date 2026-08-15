<?php

namespace App\Modules\Wallet\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'transaction_type' => $this->transaction_type->value,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'balance_before' => number_format((float) $this->balance_before, 2, '.', ''),
            'balance_after' => number_format((float) $this->balance_after, 2, '.', ''),
            'status' => $this->status,
            'description' => $this->description,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
