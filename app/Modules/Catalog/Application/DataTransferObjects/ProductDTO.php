<?php

namespace App\Modules\Catalog\Application\DataTransferObjects;

final class ProductDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $slug,
        public readonly ?string $description,
        public readonly ?string $short_description,
        public readonly ?string $category_id,
        public readonly ?string $brand_id,
        public readonly string $sku,
        public readonly ?string $barcode,
        public readonly ?string $status,
        public readonly int $quantity,
        public readonly int $low_stock_threshold,
        public readonly ?string $price,
        public readonly ?string $compare_at_price,
        public readonly ?string $cost_price,
        public readonly int $weight_grams,
        public readonly ?string $dimensions,
        public readonly ?string $hs_code,
        public readonly int $tax_rate,
        public readonly ?string $manufacturer,
        public readonly bool $is_variant,
        public readonly bool $is_featured,
        public readonly bool $is_negotiable,
        public readonly array $meta,
        public readonly array $variants,
        public readonly array $attributes,
        public readonly array $images,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            slug: $data['slug'] ?? null,
            description: $data['description'] ?? null,
            short_description: $data['short_description'] ?? null,
            category_id: $data['category_id'] ?? null,
            brand_id: $data['brand_id'] ?? null,
            sku: $data['sku'],
            barcode: $data['barcode'] ?? null,
            status: $data['status'] ?? null,
            quantity: (int) ($data['quantity'] ?? 0),
            low_stock_threshold: (int) ($data['low_stock_threshold'] ?? 5),
            price: $data['price'] ?? null,
            compare_at_price: $data['compare_at_price'] ?? null,
            cost_price: $data['cost_price'] ?? null,
            weight_grams: (int) ($data['weight_grams'] ?? 0),
            dimensions: $data['dimensions'] ?? null,
            hs_code: $data['hs_code'] ?? null,
            tax_rate: (int) ($data['tax_rate'] ?? 0),
            manufacturer: $data['manufacturer'] ?? null,
            is_variant: (bool) ($data['is_variant'] ?? false),
            is_featured: (bool) ($data['is_featured'] ?? false),
            is_negotiable: (bool) ($data['is_negotiable'] ?? false),
            meta: $data['meta'] ?? [],
            variants: $data['variants'] ?? [],
            attributes: $data['attributes'] ?? [],
            images: $data['images'] ?? [],
        );
    }
}
