<?php

namespace App\Modules\Catalog\Application\DataTransferObjects;

final class BrandRequestDTO
{
    public function __construct(
        public readonly string $brand_name,
        public readonly ?string $reason,
        public readonly ?string $brand_id,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            brand_name: $data['brand_name'],
            reason: $data['reason'] ?? null,
            brand_id: $data['brand_id'] ?? null,
        );
    }
}
