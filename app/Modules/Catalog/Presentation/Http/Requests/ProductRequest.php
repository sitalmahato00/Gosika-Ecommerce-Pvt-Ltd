<?php

namespace App\Modules\Catalog\Presentation\Http\Requests;

use App\Modules\Shared\Domain\Enums\ProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'slug' => ['nullable', 'string', 'max:220', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'category_id' => ['nullable', 'string', 'exists:categories,uuid'],
            'brand_id' => ['nullable', 'string', 'exists:brands,uuid'],
            'sku' => ['required', 'string', 'max:80'],
            'barcode' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'cost_price' => ['nullable', 'numeric', 'min:0'],
            'weight_grams' => ['nullable', 'integer', 'min:0'],
            'dimensions' => ['nullable', 'string', 'max:60'],
            'hs_code' => ['nullable', 'string', 'max:20'],
            'tax_rate' => ['nullable', 'integer', 'min:0', 'max:100'],
            'manufacturer' => ['nullable', 'string', 'max:255'],
            'is_variant' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'is_negotiable' => ['nullable', 'boolean'],
            'meta' => ['nullable', 'array'],

            'variants' => ['nullable', 'array'],
            'variants.*.sku' => ['required_with:variants', 'string', 'max:80', 'distinct'],
            'variants.*.name' => ['nullable', 'string', 'max:200'],
            'variants.*.price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.options' => ['nullable', 'array'],
            'variants.*.options.*' => ['nullable', 'string', 'max:255'],
            'variants.*.image' => ['nullable', 'image', 'max:5120'],

            'attributes' => ['nullable', 'array'],
            'attributes.*.name' => ['required_with:attributes', 'string', 'max:80'],
            'attributes.*.type' => ['nullable', 'string', 'in:text,select,color,size'],
            'attributes.*.values' => ['nullable', 'array'],
            'attributes.*.values.*' => ['nullable', 'string', 'max:255'],

            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['nullable', 'image', 'max:5120'],
        ];
    }
}
