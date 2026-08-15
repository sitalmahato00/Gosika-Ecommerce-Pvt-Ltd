<?php

namespace App\Modules\Wallet\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'vendor_id' => $this->vendor?->uuid,
            'balance' => number_format((float) $this->balance, 2, '.', ''),
            'available_balance' => number_format((float) $this->available_balance, 2, '.', ''),
            'pending_balance' => number_format((float) $this->pending_balance, 2, '.', ''),
            'currency' => $this->currency,
            'version' => $this->version,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
