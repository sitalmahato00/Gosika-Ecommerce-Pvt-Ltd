<?php

namespace App\Modules\Vendor\Application\DataTransferObjects;

final class ApplyVendorDTO
{
    public function __construct(
        public readonly string $company_name,
        public readonly string $business_email,
        public readonly ?string $business_phone,
        public readonly ?string $pan_vat,
        public readonly ?string $registration_number,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            company_name: $data['company_name'],
            business_email: $data['business_email'],
            business_phone: $data['business_phone'] ?? null,
            pan_vat: $data['pan_vat'] ?? null,
            registration_number: $data['registration_number'] ?? null,
        );
    }
}
