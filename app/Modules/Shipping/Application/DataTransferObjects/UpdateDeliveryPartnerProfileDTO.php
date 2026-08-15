<?php

namespace App\Modules\Shipping\Application\DataTransferObjects;

final class UpdateDeliveryPartnerProfileDTO
{
    public function __construct(
        public readonly ?string $name,
        public readonly ?string $email,
        public readonly ?string $vehicle_type,
        public readonly ?string $vehicle_number,
        public readonly ?array $service_areas,
        public readonly ?string $latitude,
        public readonly ?string $longitude,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'] ?? null,
            email: $data['email'] ?? null,
            vehicle_type: $data['vehicle_type'] ?? null,
            vehicle_number: $data['vehicle_number'] ?? null,
            service_areas: $data['service_areas'] ?? null,
            latitude: $data['latitude'] ?? null,
            longitude: $data['longitude'] ?? null,
        );
    }
}
