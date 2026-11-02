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
        public readonly ?int $quantity,
        public readonly ?int $low_stock_threshold,
        public readonly ?string $price,
        public readonly ?string $compare_at_price,
        public readonly ?string $cost_price,
        public readonly ?int $weight_grams,
        public readonly ?string $dimensions,
        public readonly ?string $hs_code,
        public readonly ?int $tax_rate,
        public readonly ?string $manufacturer,
        public readonly bool $is_variant,
        public readonly bool $is_featured,
        public readonly bool $is_negotiable,
        public readonly array $meta,
        public readonly array $variants,
        public readonly ?array $attributes,
        public readonly bool $variants_provided,
        public readonly array $images,
        public readonly array $image_urls,
        public readonly ?string $primary_image_url,
        public readonly ?int $primary_image_upload_index,
    ) {}

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
            quantity: isset($data['quantity']) ? (int) $data['quantity'] : null,
            low_stock_threshold: isset($data['low_stock_threshold']) ? (int) $data['low_stock_threshold'] : null,
            price: $data['price'] ?? null,
            compare_at_price: $data['compare_at_price'] ?? null,
            cost_price: $data['cost_price'] ?? null,
            weight_grams: isset($data['weight_grams']) ? (int) $data['weight_grams'] : null,
            dimensions: $data['dimensions'] ?? null,
            hs_code: $data['hs_code'] ?? null,
            tax_rate: isset($data['tax_rate']) ? (int) $data['tax_rate'] : null,
            manufacturer: $data['manufacturer'] ?? null,
            is_variant: (bool) ($data['is_variant'] ?? false),
            is_featured: (bool) ($data['is_featured'] ?? false),
            is_negotiable: (bool) ($data['is_negotiable'] ?? false),
            meta: $data['meta'] ?? [],
            variants: $data['variants'] ?? [],
            attributes: array_key_exists('attributes', $data) ? $data['attributes'] : null,
            variants_provided: (bool) ($data['variants_present'] ?? array_key_exists('variants', $data)),
            images: $data['images'] ?? [],
            image_urls: $data['image_urls'] ?? [],
            primary_image_url: $data['primary_image_url'] ?? null,
            primary_image_upload_index: isset($data['primary_image_upload_index'])
                ? (int) $data['primary_image_upload_index']
                : null,
        );
    }
}
