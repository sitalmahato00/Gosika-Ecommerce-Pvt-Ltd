<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PublicCategoryFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_filter_includes_products_from_child_categories(): void
    {
        $user = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Vendor',
            'last_name' => 'Owner',
            'email' => 'vendor@example.test',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $vendor = Vendor::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $user->id,
            'company_name' => 'Test Vendor',
            'business_email' => 'business@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        $store = Store::create([
            'uuid' => (string) Str::uuid(),
            'vendor_id' => $vendor->id,
            'name' => 'Test Store',
            'slug' => 'test-store',
            'status' => StoreStatus::ACTIVE,
        ]);
        $parent = Category::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Electronics',
            'slug' => 'electronics',
            'status' => 'active',
        ]);
        $child = Category::create([
            'uuid' => (string) Str::uuid(),
            'parent_id' => $parent->id,
            'name' => 'Mobile Phones',
            'slug' => 'mobile-phones',
            'status' => 'active',
        ]);
        Product::create([
            'uuid' => (string) Str::uuid(),
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'category_id' => $child->id,
            'name' => 'Test Phone',
            'slug' => 'test-phone',
            'sku' => 'TEST-PHONE',
            'status' => 'published',
            'stock_status' => 'in_stock',
            'quantity' => 5,
            'price' => 1000,
        ]);

        $this->getJson('/api/v1/products?category=electronics')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Test Phone');

        $this->getJson('/api/v1/products?category=unknown-category')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
