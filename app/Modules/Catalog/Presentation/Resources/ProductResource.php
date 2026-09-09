<?php

namespace App\Modules\Catalog\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'short_description' => $this->short_description,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'status' => $this->status,
            'stock_status' => $this->stock_status,
            'quantity' => $this->quantity,
            'low_stock_threshold' => $this->low_stock_threshold,
            'price' => $this->price,
            'compare_at_price' => $this->compare_at_price,
            'cost_price' => $this->when($this->relationLoaded('vendor'), $this->cost_price),
            'currency' => $this->currency,
            'weight_grams' => $this->weight_grams,
            'dimensions' => $this->dimensions,
            'hs_code' => $this->when($this->relationLoaded('vendor'), $this->hs_code),
            'tax_rate' => $this->when($this->relationLoaded('vendor'), $this->tax_rate),
            'manufacturer' => $this->when($this->relationLoaded('vendor'), $this->manufacturer),
            'is_variant' => $this->is_variant,
            'is_featured' => $this->is_featured,
            'is_negotiable' => $this->is_negotiable,
            'views_count' => $this->views_count,
            'rating_avg' => $this->rating_avg,
            'rating_count' => $this->rating_count,
            'category' => $this->when($this->relationLoaded('category') && $this->category, fn () => new CategoryResource($this->category)),
            'brand' => $this->when($this->relationLoaded('brand') && $this->brand, fn () => new BrandResource($this->brand)),
            'store' => $this->when($this->relationLoaded('store') && $this->store, fn () => [
                'id' => $this->store->uuid,
                'name' => $this->store->name,
                'slug' => $this->store->slug,
            ]),
            'vendor' => $this->when($this->relationLoaded('vendor') && $this->vendor, fn () => [
                'id' => $this->vendor->uuid,
                'company_name' => $this->vendor->company_name,
            ]),
            'images' => $this->when($this->relationLoaded('images'), fn () => $this->images->map(fn ($image) => [
                'url' => $image->file_path,
                'sort_order' => $image->sort_order,
                'is_primary' => $image->is_primary,
            ])),
            'primary_image' => $this->when($this->relationLoaded('primaryImage') && $this->primaryImage, fn () => [
                'url' => $this->primaryImage->file_path,
            ]),
            'variants' => $this->when($this->relationLoaded('variants'), fn () => $this->variants->map(fn ($variant) => [
                'id' => $variant->uuid,
                'sku' => $variant->sku,
                'name' => $variant->name,
                'price' => $variant->price,
                'compare_at_price' => $variant->compare_at_price,
                'quantity' => $variant->quantity,
                'stock_status' => $variant->stock_status,
                'options' => $variant->options,
                'is_default' => $variant->is_default,
                'image' => $variant->image,
                'attributes' => $this->when($variant->relationLoaded('attributeValues'), fn () => $variant->attributeValues->map(fn ($value) => [
                    'attribute' => $value->attribute?->name,
                    'value' => $value->value,
                ])),
            ])),
            'attributes' => $this->when($this->relationLoaded('attributes'), fn () => $this->attributes->map(fn ($attribute) => [
                'name' => $attribute->name,
                'type' => $attribute->type,
                'values' => $attribute->relationLoaded('values') ? $attribute->values->pluck('value') : [],
            ])),
            'rejection_reason' => $this->when(isset($this->meta['rejection_reason']), fn () => $this->meta['rejection_reason']),
            'suspension_reason' => $this->when(isset($this->meta['suspension_reason']), fn () => $this->meta['suspension_reason']),
            'suspended_at' => $this->when(isset($this->meta['suspended_at']), fn () => $this->meta['suspended_at']),
            'meta' => $this->when($request->user()?->hasRole('super_admin'), $this->meta),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'delivered_orders_count' => $this->when(array_key_exists('delivered_orders_count', $this->resource->getAttributes()), fn () => $this->delivered_orders_count),
            'delivered_units' => $this->when(array_key_exists('delivered_units', $this->resource->getAttributes()), fn () => $this->delivered_units),
            'delivered_revenue' => $this->when(array_key_exists('delivered_revenue', $this->resource->getAttributes()), fn () => $this->delivered_revenue),
        ];
    }
}
