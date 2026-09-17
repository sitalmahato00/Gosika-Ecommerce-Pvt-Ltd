<?php

namespace App\Modules\Vendor\Application\DataTransferObjects;

final class KycDTO
{
    public function __construct(
        public readonly string $owner_full_name,
        public readonly ?string $owner_citizenship_number,
        public readonly ?string $owner_email,
        public readonly ?string $owner_phone,
        public readonly ?string $business_type,
        public readonly ?string $address,
        public readonly ?string $province,
        public readonly ?string $district,
        public readonly ?string $municipality,
        public readonly ?string $latitude,
        public readonly ?string $longitude,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            owner_full_name: $data['owner_full_name'],
            owner_citizenship_number: $data['owner_citizenship_number'] ?? null,
            owner_email: $data['owner_email'] ?? null,
            owner_phone: $data['owner_phone'] ?? null,
            business_type: $data['business_type'] ?? null,
            address: $data['address'] ?? null,
            province: $data['province'] ?? null,
            district: $data['district'] ?? null,
            municipality: $data['municipality'] ?? null,
            latitude: $data['latitude'] ?? null,
            longitude: $data['longitude'] ?? null,
        );
    }
}
