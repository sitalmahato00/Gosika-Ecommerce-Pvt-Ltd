<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CustomerWalletTransactionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->uuid,
            'transaction_type' => $this->transaction_type,
            'amount' => (float) $this->amount,
            'balance_before' => (float) $this->balance_before,
            'balance_after' => (float) $this->balance_after,
            'status' => $this->status,
            'description' => $this->description,
            'reference_type' => $this->reference_type,
            'reference_id' => $this->reference_id,
            'meta' => $this->meta,
            'created_at' => $this->created_at,
        ];
    }
}