<?php

namespace App\Modules\Catalog\Presentation\Http\Requests;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $vendorId = $this->user()?->vendor?->id;
        $productId = $this->route('product') ?? $this->route('productId');
        $skuRule = Rule::unique('products', 'sku')
            ->where(fn ($query) => $query->where('vendor_id', $vendorId));

        if ($productId && $vendorId) {
            $ownedProductId = Product::query()
                ->where('uuid', $productId)
                ->where('vendor_id', $vendorId)
                ->value('id');

            if ($ownedProductId) {
                $skuRule->ignore($ownedProductId);
            }
        }

        return [
            'name' => ['required', 'string', 'max:200'],
            'slug' => ['nullable', 'string', 'max:220', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'category_id' => ['nullable', 'string', 'exists:categories,uuid'],
            'brand_id' => ['nullable', 'string', 'exists:brands,uuid'],
            'sku' => ['required', 'string', 'max:80', $skuRule],
            'barcode' => ['nullable', 'string', 'max:80'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
            'price' => ['required', 'numeric', 'min:0'],
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
            'image_urls' => ['nullable', 'array', 'max:10'],
            'image_urls.*' => ['required', 'url', 'max:2048'],
            'primary_image_url' => ['nullable', 'url', 'max:2048'],
            'primary_image_upload_index' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->route('product') ?? $this->route('productId')) {
                return;
            }

            $uploadedImages = $this->file('images', []);
            $imageUrls = $this->input('image_urls', []);
            $uploadedCount = is_array($uploadedImages) ? count($uploadedImages) : (bool) $uploadedImages;
            $urlCount = is_array($imageUrls) ? count($imageUrls) : (bool) $imageUrls;

            if ($uploadedCount + $urlCount === 0) {
                $validator->errors()->add('images', 'Please add at least one product image.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'sku.unique' => 'This SKU is already used by another product in your store. Please choose a different SKU.',
            'images.*.image' => 'Each product image must be a valid image file.',
            'images.*.max' => 'Each product image must be 5 MB or smaller.',
            'image_urls.*.url' => 'Enter a valid image URL starting with https://.',
        ];
    }
}
