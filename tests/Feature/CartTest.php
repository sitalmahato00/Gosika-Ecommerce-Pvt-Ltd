<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CartTest extends TestCase
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

    protected function publishedProduct(int $quantity = 10): Product
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Cart Vendor',
            'business_email' => 'cart@vendor.com.np',
            'status' => VendorStatus::APPROVED,
        ]);

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Cart Vendor Store',
            'slug' => 'cart-vendor-store-'.$vendor->id,
            'contact_email' => 'cart@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        return Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Test Product',
            'slug' => 'test-product-'.$vendor->id,
            'sku' => 'CART-'.$vendor->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => $quantity,
            'low_stock_threshold' => 2,
            'price' => 1000.00,
        ]);
    }

    public function test_guest_can_add_item_to_cart_with_session(): void
    {
        $product = $this->publishedProduct();

        $response = $this->withHeaders(['X-Session-Id' => 'guest-123'])
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => 2]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.cart.item_count', 2)
            ->assertJsonPath('data.cart.subtotal', '2000.00')
            ->assertJsonPath('data.cart.items.0.name', 'Test Product');

        $this->assertDatabaseHas('carts', ['session_id' => 'guest-123']);
    }

    public function test_guest_cart_is_visible_via_session_header(): void
    {
        $product = $this->publishedProduct();

        $this->withHeaders(['X-Session-Id' => 'guest-abc'])
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid])
            ->assertOk();

        $this->withHeaders(['X-Session-Id' => 'guest-abc'])
            ->getJson('/api/v1/cart/')
            ->assertOk()
            ->assertJsonPath('data.item_count', 1);
    }

    public function test_authenticated_user_cart_is_persisted(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => 3])
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/cart/')
            ->assertOk()
            ->assertJsonPath('data.item_count', 3)
            ->assertJsonPath('data.subtotal', '3000.00');
    }

    public function test_cannot_add_more_than_available_stock(): void
    {
        $product = $this->publishedProduct(quantity: 5);

        $this->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => 10])
            ->assertStatus(409);
    }

    public function test_quantity_can_be_updated_and_item_removed(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct();

        $created = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => 1]);

        $itemId = $created->json('data.cart.items.0.id');

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/cart/items/'.$itemId, ['quantity' => 4])
            ->assertOk()
            ->assertJsonPath('data.item_count', 4);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/v1/cart/items/'.$itemId)
            ->assertOk()
            ->assertJsonPath('data.item_count', 0);
    }

    public function test_cannot_update_item_from_another_cart(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct();

        $created = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid]);

        $itemId = $created->json('data.cart.items.0.id');

        $other = $this->customer();
        $this->actingAs($other, 'sanctum')
            ->putJson('/api/v1/cart/items/'.$itemId, ['quantity' => 2])
            ->assertStatus(404);
    }

    public function test_cart_can_be_cleared(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/v1/cart/')
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/cart/')
            ->assertOk()
            ->assertJsonPath('data.item_count', 0);
    }

    public function test_adding_same_product_increments_quantity(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => 2]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => 3])
            ->assertOk()
            ->assertJsonPath('data.cart.item_count', 5);
    }
}
