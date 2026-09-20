<?php

namespace App\Modules\Vendor\Application\DataTransferObjects;

final class StoreDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $slug,
        public readonly ?string $description,
        public readonly ?string $contact_email,
        public readonly ?string $contact_phone,
        public readonly ?string $logo = null,
        public readonly ?string $banner = null,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            slug: $data['slug'] ?? null,
            description: $data['description'] ?? null,
            contact_email: $data['contact_email'] ?? null,
            contact_phone: $data['contact_phone'] ?? null,
            logo: $data['logo'] ?? null,
            banner: $data['banner'] ?? null,
        );
    }
}
