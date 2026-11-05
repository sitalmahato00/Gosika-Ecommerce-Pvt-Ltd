<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicProductFiltersTest extends TestCase
{
    use RefreshDatabase;

    public function test_multiple_filters_and_custom_price_bounds_combine_across_sections(): void
    {
        $store = $this->createStore();
        $electronics = $this->createCategory('Electronics');
        $apparel = $this->createCategory('Apparel');
        $home = $this->createCategory('Home');
        $brandA = $this->createBrand('Brand A');
        $brandB = $this->createBrand('Brand B');

        $inStock = $this->createProduct($store, $electronics, $brandA, 'Filter Product In Stock', 900, 4.5, 'in_stock');
        $lowStock = $this->createProduct($store, $apparel, $brandB, 'Filter Product Low Stock', 3000, 3.2, 'low_stock');
        $outsidePrice = $this->createProduct($store, $electronics, $brandB, 'Filter Product Outside Price', 6000, 4.8, 'in_stock');
        $outsideCategory = $this->createProduct($store, $home, $brandA, 'Filter Product Outside Category', 1200, 1.0, 'in_stock');

        $query = http_build_query([
            'category' => [$electronics->slug, $apparel->slug],
            'brand' => [$brandA->uuid, $brandB->uuid],
            'price_ranges' => ['under_1000', '1000_5000'],
            'min_price' => 700,
            'max_price' => 4000,
            'min_rating' => [3, 4],
            'availability' => ['in_stock', 'low_stock'],
            'sort' => 'price_asc',
        ]);

        $this->getJson('/api/v1/products?'.$query)
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $inStock->uuid)
            ->assertJsonPath('data.1.id', $lowStock->uuid)
            ->assertJsonMissing(['id' => $outsidePrice->uuid])
            ->assertJsonMissing(['id' => $outsideCategory->uuid]);
    }

    public function test_custom_price_bounds_can_filter_out_of_stock_products(): void
    {
        $store = $this->createStore();
        $category = $this->createCategory('Out of Stock');
        $brand = $this->createBrand('Out of Stock Brand');
        $product = $this->createProduct($store, $category, $brand, 'Custom Price Out of Stock', 2500, 3.5, 'out_of_stock');

        $this->getJson('/api/v1/products?'.http_build_query([
            'min_price' => 2000,
            'max_price' => 3000,
            'availability' => ['out_of_stock'],
        ]))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $product->uuid);
    }

    public function test_custom_price_filter_accepts_only_a_minimum_or_maximum(): void
    {
        $store = $this->createStore();
        $category = $this->createCategory('One-sided Price');
        $brand = $this->createBrand('One-sided Price Brand');
        $cheap = $this->createProduct($store, $category, $brand, 'One-sided Cheap Product', 500, 3.5, 'in_stock');
        $middle = $this->createProduct($store, $category, $brand, 'One-sided Middle Product', 2500, 3.5, 'in_stock');
        $expensive = $this->createProduct($store, $category, $brand, 'One-sided Expensive Product', 6000, 3.5, 'in_stock');

        $this->getJson('/api/v1/products?max_price=3000&sort=price_asc')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $cheap->uuid)
            ->assertJsonPath('data.1.id', $middle->uuid);

        $this->getJson('/api/v1/products?min_price=2000&sort=price_asc')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $middle->uuid)
            ->assertJsonPath('data.1.id', $expensive->uuid);
    }

    public function test_custom_price_bounds_reject_a_minimum_above_the_maximum(): void
    {
        $this->getJson('/api/v1/products?'.http_build_query([
            'min_price' => 5000,
            'max_price' => 1000,
        ]))->assertUnprocessable();
    }

    private function createStore(): Store
    {
        $user = User::factory()->create();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Product Filter Vendor '.Str::uuid(),
            'business_email' => 'filter-'.Str::uuid().'@example.test',
            'status' => 'approved',
        ]);

        return Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Product Filter Store '.Str::uuid(),
            'slug' => 'product-filter-'.Str::lower(Str::random(8)),
            'status' => 'active',
        ]);
    }

    private function createCategory(string $name): Category
    {
        return Category::query()->create([
            'uuid' => (string) Str::uuid(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'status' => 'active',
        ]);
    }

    private function createBrand(string $name): Brand
    {
        return Brand::query()->create([
            'uuid' => (string) Str::uuid(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'status' => 'active',
        ]);
    }

    private function createProduct(
        Store $store,
        Category $category,
        Brand $brand,
        string $name,
        int $price,
        float $rating,
        string $stockStatus,
    ): Product {
        return Product::query()->create([
            'uuid' => (string) Str::uuid(),
            'vendor_id' => $store->vendor_id,
            'store_id' => $store->id,
            'category_id' => $category->id,
            'brand_id' => $brand->id,
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(5)),
            'sku' => Str::upper(Str::random(10)),
            'status' => 'published',
            'stock_status' => $stockStatus,
            'quantity' => $stockStatus === 'out_of_stock' ? 0 : 10,
            'price' => $price,
            'rating_avg' => $rating,
            'rating_count' => 5,
        ]);
    }
}
