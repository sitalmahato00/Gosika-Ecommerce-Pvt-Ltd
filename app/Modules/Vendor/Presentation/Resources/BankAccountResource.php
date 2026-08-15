<?php

namespace App\Modules\Vendor\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BankAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'bank_name' => $this->bank_name,
            'branch_name' => $this->branch_name,
            'account_name' => $this->account_name,
            'account_number' => '****'.substr((string) $this->account_number, -4),
            'account_type' => $this->account_type,
            'is_verified' => $this->is_verified,
            'is_default' => $this->is_default,
        ];
    }
}
