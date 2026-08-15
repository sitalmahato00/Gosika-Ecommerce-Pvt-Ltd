<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketplace\Infrastructure\Models\Wishlist;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WishlistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    protected function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::CUSTOMER);

        return $user;
    }

    protected function publishedProduct(): Product
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Wishlist Vendor',
            'business_email' => 'wish@vendor.com.np',
            'status' => VendorStatus::APPROVED,
        ]);

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Wishlist Vendor Store',
            'slug' => 'wishlist-vendor-store-'.$vendor->id,
            'contact_email' => 'wish@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        return Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Wish Product',
            'slug' => 'wish-product-'.$vendor->id,
            'sku' => 'WISH-'.$vendor->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 10,
            'low_stock_threshold' => 2,
            'price' => 500.00,
        ]);
    }

    public function test_guest_cannot_access_wishlist(): void
    {
        $this->getJson('/api/v1/wishlist/')->assertUnauthorized();
    }

    public function test_user_can_add_and_list_wishlist(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/wishlist/items', ['product_id' => $product->uuid])
            ->assertOk()
            ->assertJsonPath('data.wishlisted', true);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/wishlist/')
            ->assertOk()
            ->assertJsonPath('data.item_count', 1)
            ->assertJsonPath('data.items.0.product.id', $product->uuid);

        $this->assertDatabaseHas('wishlists', ['user_id' => $user->id]);
    }

    public function test_user_can_remove_from_wishlist(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/wishlist/items', ['product_id' => $product->uuid])
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/v1/wishlist/items', ['product_id' => $product->uuid])
            ->assertOk()
            ->assertJsonPath('data.wishlisted', false);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/wishlist/')
            ->assertOk()
            ->assertJsonPath('data.item_count', 0);
    }

    public function test_wishlist_status_endpoint(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/wishlist/status/'.$product->uuid)
            ->assertOk()
            ->assertJsonPath('data.wishlisted', false);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/wishlist/items', ['product_id' => $product->uuid]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/wishlist/status/'.$product->uuid)
            ->assertOk()
            ->assertJsonPath('data.wishlisted', true);
    }

    public function test_wishlist_is_isolated_per_user(): void
    {
        $userA = $this->customer();
        $userB = $this->customer();
        $product = $this->publishedProduct();

        $this->actingAs($userA, 'sanctum')
            ->postJson('/api/v1/wishlist/items', ['product_id' => $product->uuid]);

        $this->actingAs($userB, 'sanctum')
            ->getJson('/api/v1/wishlist/')
            ->assertOk()
            ->assertJsonPath('data.item_count', 0);
    }
}
