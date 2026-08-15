<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketplaceTest extends TestCase
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

    protected function activeStore(): array
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Marketplace Vendor',
            'business_email' => 'mp@vendor.com.np',
            'status' => VendorStatus::APPROVED,
        ]);

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Koshi Store',
            'slug' => 'koshi-store-'.$vendor->id,
            'contact_email' => 'mp@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        $product = Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Marketplace Product',
            'slug' => 'mp-product-'.$vendor->id,
            'sku' => 'MP-'.$vendor->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 20,
            'low_stock_threshold' => 2,
            'price' => 1000.00,
            'tax_rate' => 0,
        ]);

        return [$vendor, $store, $product];
    }

    protected function deliveredOrderFor(User $user, Product $product): Order
    {
        [$vendor, $store] = [$product->vendor, $product->store];

        $order = Order::query()->create([
            'user_id' => $user->id,
            'order_number' => 'ORD-TEST-'.$product->id,
            'payment_method' => 'cod',
            'payment_status' => 'paid',
            'status' => OrderStatus::DELIVERED,
            'subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'currency' => 'NPR',
            'placed_at' => now(),
            'completed_at' => now(),
        ]);

        $vendorOrder = VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'vendor_order_number' => 'VO-TEST-'.$order->id,
            'status' => OrderStatus::COMPLETED,
            'delivery_status' => 'delivered',
            'items_subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'commission_rate' => 10,
            'commission_amount' => 0,
            'vendor_payable' => 0,
        ]);

        OrderItem::query()->create([
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'vendor_id' => $vendor->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        return $order;
    }

    public function test_public_store_listing_shows_active_stores(): void
    {
        $this->activeStore();

        $response = $this->getJson('/api/v1/marketplace/stores');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Koshi Store')
            ->assertJsonPath('data.0.product_count', 1);
    }

    public function test_public_store_detail_and_products(): void
    {
        [$vendor, $store, $product] = $this->activeStore();

        $this->getJson("/api/v1/marketplace/stores/{$store->uuid}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Koshi Store')
            ->assertJsonPath('data.product_count', 1);

        $this->getJson("/api/v1/marketplace/stores/{$store->uuid}/products")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Marketplace Product');
    }

    public function test_inactive_store_not_listed(): void
    {
        [$vendor, $store, $product] = $this->activeStore();
        $store->update(['status' => StoreStatus::SUSPENDED]);

        $this->getJson('/api/v1/marketplace/stores')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->getJson("/api/v1/marketplace/stores/{$store->uuid}")
            ->assertStatus(404);
    }

    public function test_product_view_is_tracked_for_authenticated_user(): void
    {
        $user = $this->customer();
        [, , $product] = $this->activeStore();

        $this->actingAs($user, 'sanctum')->getJson("/api/v1/products/{$product->uuid}")
            ->assertOk();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/marketplace/recently-viewed');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.product.id', $product->uuid);
    }

    public function test_recently_viewed_requires_auth(): void
    {
        $this->getJson('/api/v1/marketplace/recently-viewed')->assertUnauthorized();
    }

    public function test_customer_can_review_purchased_product(): void
    {
        $user = $this->customer();
        [, , $product] = $this->activeStore();
        $this->deliveredOrderFor($user, $product);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/marketplace/products/{$product->uuid}/reviews", [
            'rating' => 5,
            'title' => 'Great product',
            'body' => 'Very good quality.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.rating', 5)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('product_reviews', [
            'user_id' => $user->id,
            'product_id' => $product->id,
            'rating' => 5,
            'status' => 'pending',
        ]);
    }

    public function test_customer_cannot_review_unpurchased_product(): void
    {
        $user = $this->customer();
        [, , $product] = $this->activeStore();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/marketplace/products/{$product->uuid}/reviews", ['rating' => 4])
            ->assertStatus(403);
    }

    public function test_customer_cannot_review_twice(): void
    {
        $user = $this->customer();
        [, , $product] = $this->activeStore();
        $this->deliveredOrderFor($user, $product);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/marketplace/products/{$product->uuid}/reviews", ['rating' => 4])
            ->assertCreated();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/marketplace/products/{$product->uuid}/reviews", ['rating' => 5])
            ->assertStatus(409);
    }

    public function test_customer_can_review_purchased_store(): void
    {
        $user = $this->customer();
        [$vendor, $store, $product] = $this->activeStore();
        $order = $this->deliveredOrderFor($user, $product);

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/marketplace/stores/{$store->uuid}/reviews", [
            'rating' => 4,
            'body' => 'Good service.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.rating', 4)
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('store_reviews', [
            'user_id' => $user->id,
            'store_id' => $store->id,
            'vendor_order_id' => $order->id,
            'rating' => 4,
        ]);
    }

    public function test_reviews_only_approved_are_listed_publicly(): void
    {
        $user = $this->customer();
        [, , $product] = $this->activeStore();
        $this->deliveredOrderFor($user, $product);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/marketplace/products/{$product->uuid}/reviews", ['rating' => 4])
            ->assertCreated();

        $this->getJson("/api/v1/marketplace/products/{$product->uuid}/reviews")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        \App\Modules\Marketplace\Infrastructure\Models\ProductReview::first()->update(['status' => 'approved']);

        $this->getJson("/api/v1/marketplace/products/{$product->uuid}/reviews")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.rating', 4);
    }

    public function test_store_reviews_require_purchase(): void
    {
        $user = $this->customer();
        [, $store, ] = $this->activeStore();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/marketplace/stores/{$store->uuid}/reviews", ['rating' => 5])
            ->assertStatus(403);
    }

    public function test_review_rating_validation(): void
    {
        $user = $this->customer();
        [, , $product] = $this->activeStore();
        $this->deliveredOrderFor($user, $product);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/marketplace/products/{$product->uuid}/reviews", ['rating' => 6])
            ->assertStatus(422);
    }
}
