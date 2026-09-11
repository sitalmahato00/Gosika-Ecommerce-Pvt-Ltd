<?php

namespace App\Modules\Shipping\Application\DataTransferObjects;

final class UpdateDeliveryPartnerProfileDTO
{
    public function __construct(
        public readonly ?string $name,
        public readonly ?string $email,
        public readonly ?string $vehicle_type,
        public readonly ?string $vehicle_number,
        public readonly ?string $vehicle_model,
        public readonly ?string $vehicle_color,
        public readonly ?int $vehicle_year,
        public readonly ?string $insurance_expiry,
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
            vehicle_model: $data['vehicle_model'] ?? null,
            vehicle_color: $data['vehicle_color'] ?? null,
            vehicle_year: $data['vehicle_year'] ?? null,
            insurance_expiry: $data['insurance_expiry'] ?? null,
            service_areas: $data['service_areas'] ?? null,
            latitude: $data['latitude'] ?? null,
            longitude: $data['longitude'] ?? null,
        );
    }
}