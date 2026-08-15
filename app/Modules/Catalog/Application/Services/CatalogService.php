<?php

namespace App\Modules\Catalog\Application\Services;

use App\Modules\Catalog\Application\DataTransferObjects\BrandRequestDTO;
use App\Modules\Catalog\Application\DataTransferObjects\ProductDTO;
use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\BrandRequest;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\ProductAttribute;
use App\Modules\Catalog\Infrastructure\Models\ProductAttributeValue;
use App\Modules\Catalog\Infrastructure\Models\ProductImage;
use App\Modules\Catalog\Infrastructure\Models\ProductVariant;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Domain\Enums\StockStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CatalogService
{
    public function createProduct(User $user, ProductDTO $dto): Product
    {
        $vendor = $this->vendorFor($user);

        return DB::transaction(function () use ($vendor, $dto) {
            $product = Product::query()->create([
                'vendor_id' => $vendor->id,
                'store_id' => $vendor->stores()->value('id'),
                'category_id' => $this->resolveId(Category::class, $dto->category_id),
                'brand_id' => $this->resolveId(Brand::class, $dto->brand_id),
                'name' => $dto->name,
                'slug' => $this->uniqueProductSlug($dto->slug ?: $dto->name),
                'description' => $dto->description,
                'short_description' => $dto->short_description,
                'sku' => $dto->sku,
                'barcode' => $dto->barcode,
                'status' => $dto->status ?: ProductStatus::DRAFT,
                'stock_status' => StockStatus::OUT_OF_STOCK,
                'quantity' => $dto->quantity,
                'low_stock_threshold' => $dto->low_stock_threshold,
                'price' => $dto->price,
                'compare_at_price' => $dto->compare_at_price,
                'cost_price' => $dto->cost_price,
                'weight_grams' => $dto->weight_grams,
                'dimensions' => $dto->dimensions,
                'hs_code' => $dto->hs_code,
                'tax_rate' => $dto->tax_rate,
                'manufacturer' => $dto->manufacturer,
                'is_variant' => $dto->is_variant || ! empty($dto->variants),
                'is_featured' => $dto->is_featured,
                'is_negotiable' => $dto->is_negotiable,
                'meta' => $dto->meta,
            ]);

            $this->syncVariants($product, $dto->variants);
            $this->syncAttributes($product, $dto->attributes);
            $this->storeImages($product, $dto->images);
            $this->refreshDerivedState($product);

            return $product;
        });
    }

    public function updateProduct(User $user, Product $product, ProductDTO $dto): Product
    {
        $vendor = $this->vendorFor($user);
        $this->assertOwns($vendor, $product);
        $this->assertEditable($product);

        return DB::transaction(function () use ($product, $dto) {
            $product->update([
                'category_id' => $this->resolveId(Category::class, $dto->category_id),
                'brand_id' => $this->resolveId(Brand::class, $dto->brand_id),
                'name' => $dto->name,
                'slug' => $dto->slug && $dto->slug !== $product->slug
                    ? $this->uniqueProductSlug($dto->slug)
                    : $product->slug,
                'description' => $dto->description,
                'short_description' => $dto->short_description,
                'sku' => $dto->sku,
                'barcode' => $dto->barcode,
                'status' => $dto->status ?: $product->status,
                'low_stock_threshold' => $dto->low_stock_threshold,
                'price' => $dto->price,
                'compare_at_price' => $dto->compare_at_price,
                'cost_price' => $dto->cost_price,
                'weight_grams' => $dto->weight_grams,
                'dimensions' => $dto->dimensions,
                'hs_code' => $dto->hs_code,
                'tax_rate' => $dto->tax_rate,
                'manufacturer' => $dto->manufacturer,
                'is_variant' => $dto->is_variant || ! empty($dto->variants),
                'is_featured' => $dto->is_featured,
                'is_negotiable' => $dto->is_negotiable,
                'meta' => $dto->meta,
            ]);

            $product->variants()->delete();
            $product->attributes()->delete();
            $this->syncVariants($product, $dto->variants);
            $this->syncAttributes($product, $dto->attributes);
            if (! empty($dto->images)) {
                $this->storeImages($product, $dto->images);
            }
            $this->refreshDerivedState($product);

            return $product;
        });
    }

    public function submitForReview(User $user, Product $product): Product
    {
        $vendor = $this->vendorFor($user);
        $this->assertOwns($vendor, $product);
        $this->assertEditable($product);

        if (! $product->price && ! $product->is_variant) {
            throw new DomainException('Product must have a price before submission.');
        }

        $product->update(['status' => ProductStatus::PENDING_REVIEW]);

        return $product;
    }

    public function approveProduct(User $admin, Product $product): Product
    {
        $product->update(['status' => ProductStatus::PUBLISHED]);

        return $product;
    }

    public function rejectProduct(User $admin, Product $product, string $reason): Product
    {
        $meta = $product->meta ?? [];
        $meta['rejection_reason'] = $reason;
        $meta['rejected_at'] = now()->toISOString();

        $product->update([
            'status' => ProductStatus::DRAFT,
            'meta' => $meta,
        ]);

        return $product;
    }

    public function requestBrand(User $user, BrandRequestDTO $dto): BrandRequest
    {
        $vendor = $this->vendorFor($user);

        $existing = BrandRequest::query()->where('vendor_id', $vendor->id)
            ->where('status', ReviewStatus::PENDING)
            ->where(function ($q) use ($dto) {
                $q->where('brand_name', $dto->brand_name)
                    ->orWhere('brand_id', $dto->brand_id);
            })
            ->exists();

        if ($existing) {
            throw new DomainException('A pending brand request already exists.');
        }

        return BrandRequest::query()->create([
            'vendor_id' => $vendor->id,
            'brand_id' => $this->resolveId(Brand::class, $dto->brand_id),
            'brand_name' => $dto->brand_name,
            'reason' => $dto->reason,
            'status' => ReviewStatus::PENDING,
        ]);
    }

    public function approveBrandRequest(User $admin, BrandRequest $request): BrandRequest
    {
        $brand = $request->brand_id
            ? Brand::query()->find($request->brand_id)
            : Brand::query()->firstOrCreate(
                ['slug' => Str::slug($request->brand_name)],
                [
                    'name' => $request->brand_name,
                    'status' => 'active',
                ]
            );

        $request->update([
            'brand_id' => $brand->id,
            'status' => ReviewStatus::APPROVED,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        return $request;
    }

    public function rejectBrandRequest(User $admin, BrandRequest $request, string $reason): BrandRequest
    {
        $request->update([
            'status' => ReviewStatus::REJECTED,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'review_notes' => $reason,
        ]);

        return $request;
    }

    public function deleteProduct(User $user, Product $product): void
    {
        $vendor = $this->vendorFor($user);
        $this->assertOwns($vendor, $product);

        $product->delete();
    }

    public function restoreProduct(User $user, Product $product): Product
    {
        $vendor = $this->vendorFor($user);
        $this->assertOwns($vendor, $product);

        $product->restore();

        return $product;
    }

    protected function vendorFor(User $user): Vendor
    {
        $vendor = $user->vendor;

        if (! $vendor) {
            throw new DomainException('You must apply for a vendor account first.', 422);
        }

        if ($vendor->status !== VendorStatus::APPROVED) {
            throw new DomainException('Vendor account must be approved to manage products.', 403);
        }

        return $vendor;
    }

    protected function assertOwns(Vendor $vendor, Product $product): void
    {
        if ($product->vendor_id !== $vendor->id) {
            throw new DomainException('You do not own this product.', 403);
        }
    }

    protected function assertEditable(Product $product): void
    {
        if (! in_array($product->status, [ProductStatus::DRAFT, ProductStatus::HIDDEN], true)) {
            throw new DomainException('Product cannot be edited in its current state.');
        }
    }

    protected function syncVariants(Product $product, array $variants): void
    {
        if (empty($variants)) {
            return;
        }

        $defaultSet = false;

        foreach ($variants as $index => $variantData) {
            $options = $variantData['options'] ?? [];

            $variant = ProductVariant::query()->create([
                'product_id' => $product->id,
                'sku' => $variantData['sku'],
                'name' => $variantData['name'] ?? null,
                'combination_hash' => empty($options) ? null : md5(json_encode($options)),
                'price' => $variantData['price'],
                'compare_at_price' => $variantData['compare_at_price'] ?? null,
                'quantity' => $variantData['quantity'] ?? 0,
                'stock_status' => StockStatus::OUT_OF_STOCK,
                'options' => $options,
                'is_default' => ! $defaultSet,
            ]);

            $defaultSet = true;

            if (isset($variantData['image'])) {
                $this->storeVariantImage($product, $variant, $variantData['image']);
            }
        }
    }

    protected function syncAttributes(Product $product, array $attributes): void
    {
        foreach ($attributes as $attributeData) {
            $attribute = ProductAttribute::query()->create([
                'product_id' => $product->id,
                'name' => $attributeData['name'],
                'type' => $attributeData['type'] ?? 'text',
            ]);

            foreach ($attributeData['values'] ?? [] as $value) {
                ProductAttributeValue::query()->create([
                    'attribute_id' => $attribute->id,
                    'variant_id' => null,
                    'value' => $value,
                ]);
            }
        }
    }

    protected function storeImages(Product $product, array $images): void
    {
        foreach ($images as $index => $image) {
            if (! $image instanceof UploadedFile) {
                continue;
            }

            $path = $image->store('products/'.$product->uuid, 'public');

            ProductImage::query()->create([
                'product_id' => $product->id,
                'variant_id' => null,
                'file_path' => $path,
                'sort_order' => $index,
                'is_primary' => $index === 0 && $product->images()->where('is_primary', true)->doesntExist(),
            ]);
        }
    }

    protected function storeVariantImage(Product $product, ProductVariant $variant, UploadedFile $image): void
    {
        $path = $image->store('products/'.$product->uuid.'/variants', 'public');

        ProductImage::query()->create([
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'file_path' => $path,
            'sort_order' => 0,
            'is_primary' => false,
        ]);

        $variant->update(['image' => $path]);
    }

    protected function refreshDerivedState(Product $product): void
    {
        $product->refresh();

        $quantity = $product->is_variant
            ? (int) $product->variants()->sum('quantity')
            : (int) $product->quantity;

        $price = $product->is_variant
            ? $product->variants()->min('price')
            : $product->price;

        $stockStatus = $this->resolveStockStatus($quantity, $product->low_stock_threshold);

        $product->update([
            'quantity' => $quantity,
            'price' => $price ?? $product->price,
            'stock_status' => $stockStatus,
        ]);
    }

    protected function resolveStockStatus(int $quantity, int $threshold): StockStatus
    {
        if ($quantity <= 0) {
            return StockStatus::OUT_OF_STOCK;
        }

        if ($quantity <= $threshold) {
            return StockStatus::LOW_STOCK;
        }

        return StockStatus::IN_STOCK;
    }

    protected function uniqueProductSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        $i = 2;

        while (Product::query()->where('slug', $slug)->withTrashed()->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    protected function resolveId(string $model, ?string $uuid): ?int
    {
        if (! $uuid) {
            return null;
        }

        return $model::query()->where('uuid', $uuid)->value('id');
    }
}
