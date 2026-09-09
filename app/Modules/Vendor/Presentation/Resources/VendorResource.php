<?php

namespace App\Modules\Vendor\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'company_name' => $this->company_name,
            'business_email' => $this->business_email,
            'business_phone' => $this->business_phone,
            'pan_vat' => $this->pan_vat,
            'registration_number' => $this->registration_number,
            'logo' => $this->logo,
            'status' => $this->status,
            'commission_rate' => $this->commission_rate,
            'approved_at' => $this->approved_at?->toISOString(),
            'kyc' => new KycResource($this->whenLoaded('kyc')),
            'stores' => StoreResource::collection($this->whenLoaded('stores')),
            'bank_accounts' => BankAccountResource::collection($this->whenLoaded('bankAccounts')),
            'documents' => $this->whenLoaded('documents'),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
