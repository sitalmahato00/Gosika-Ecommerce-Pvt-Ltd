<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
        $this->seed(\Database\Seeders\SettingsSeeder::class);
    }

    protected function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::CUSTOMER);

        return $user;
    }

    protected function publishedProduct(int $price = 1000): Product
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Checkout Vendor',
            'business_email' => 'checkout@vendor.com.np',
            'status' => VendorStatus::APPROVED,
        ]);

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Checkout Vendor Store',
            'slug' => 'checkout-vendor-store-'.$vendor->id,
            'contact_email' => 'checkout@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        return Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Checkout Product',
            'slug' => 'checkout-product-'.$vendor->id,
            'sku' => 'CHK-'.$vendor->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 20,
            'low_stock_threshold' => 2,
            'price' => $price,
            'tax_rate' => 0,
        ]);
    }

    protected function addressFor(User $user): CustomerAddress
    {
        return CustomerAddress::query()->create([
            'user_id' => $user->id,
            'address_type' => 'shipping',
            'label' => 'Home',
            'full_name' => 'Checkout Customer',
            'phone' => '9812345678',
            'address_line_1' => 'Baluwatar',
            'postal_code' => '44600',
        ]);
    }

    protected function addToCart(User $user, Product $product, int $qty = 1): void
    {
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => $qty]);
    }

    public function test_summary_reflects_cart_totals(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct(price: 1000);

        $this->addToCart($user, $product, 2);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/checkout/summary');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.item_count', 2)
            ->assertJsonPath('data.subtotal', '2000.00')
            ->assertJsonPath('data.delivery_charge', '0.00')
            ->assertJsonPath('data.total', '2000.00');
    }

    public function test_summary_applies_flat_delivery_below_threshold(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct(price: 500);

        $this->addToCart($user, $product, 1);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/checkout/summary');

        $response->assertOk()
            ->assertJsonPath('data.subtotal', '500.00')
            ->assertJsonPath('data.delivery_charge', '80.00')
            ->assertJsonPath('data.total', '580.00');
    }

    public function test_checkout_session_created_with_addresses(): void
    {
        $user = $this->customer();
        $product = $this->publishedProduct(price: 1000);
        $address = $this->addressFor($user);

        $this->addToCart($user, $product);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/checkout/', [
            'shipping_address_id' => $address->uuid,
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.payment_method', 'cod')
            ->assertJsonPath('data.shipping_address.id', $address->uuid)
            ->assertJsonPath('data.total', '1080.00');

        $this->assertDatabaseHas('checkout_sessions', [
            'user_id' => $user->id,
            'payment_method' => 'cod',
            'status' => 'pending',
        ]);
    }

    public function test_checkout_rejects_empty_cart(): void
    {
        $user = $this->customer();
        $address = $this->addressFor($user);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/checkout/', ['shipping_address_id' => $address->uuid])
            ->assertStatus(422);
    }

    public function test_checkout_requires_own_address(): void
    {
        $user = $this->customer();
        $other = $this->customer();
        $product = $this->publishedProduct();
        $address = $this->addressFor($other);

        $this->addToCart($user, $product);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/checkout/', [
            'shipping_address_id' => $address->uuid,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_checkout_session_not_found_for_another_user(): void
    {
        $user = $this->customer();
        $other = $this->customer();
        $product = $this->publishedProduct();
        $address = $this->addressFor($user);

        $this->addToCart($user, $product);
        $created = $this->actingAs($user, 'sanctum')->postJson('/api/v1/checkout/', [
            'shipping_address_id' => $address->uuid,
        ]);

        $this->actingAs($other, 'sanctum')
            ->getJson("/api/v1/checkout/{$created->json('data.id')}")
            ->assertStatus(404);
    }
}
