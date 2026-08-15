<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
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

    protected function vendorWithProduct(int $price = 1000, int $quantity = 20, string $tag = 'order'): array
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => $tag.' Vendor',
            'business_email' => $tag.'@vendor.com.np',
            'status' => VendorStatus::APPROVED,
        ]);

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => $tag.' Store',
            'slug' => $tag.'-store-'.$vendor->id,
            'contact_email' => $tag.'@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        $product = Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => $tag.' Product',
            'slug' => $tag.'-product-'.$vendor->id,
            'sku' => strtoupper($tag).'-'.$vendor->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => $quantity,
            'low_stock_threshold' => 2,
            'price' => $price,
            'tax_rate' => 0,
        ]);

        return [$vendor, $store, $product];
    }

    protected function addressFor(User $user): CustomerAddress
    {
        return CustomerAddress::query()->create([
            'user_id' => $user->id,
            'address_type' => 'shipping',
            'label' => 'Home',
            'full_name' => 'Order Customer',
            'phone' => '9812345678',
            'address_line_1' => 'Baluwatar',
            'postal_code' => '44600',
        ]);
    }

    protected function checkout(User $user, Product $product, int $qty = 1): array
    {
        $address = $this->addressFor($user);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => $qty])
            ->assertOk();

        $session = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/checkout/', ['shipping_address_id' => $address->uuid]);

        return [$address, $session->json('data.id')];
    }

    public function test_order_placed_with_cod(): void
    {
        $user = $this->customer();
        [, , $product] = $this->vendorWithProduct(price: 1000);
        [$address, $sessionId] = $this->checkout($user, $product);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/', [
            'checkout_session_id' => $sessionId,
            'customer_notes' => 'Please deliver in the morning.',
        ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.payment_method', 'cod')
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.grand_total', '1080.00')
            ->assertJsonCount(1, 'data.vendor_orders')
            ->assertJsonPath('data.items.0.quantity', 1)
            ->assertJsonPath('data.can_cancel', true);

        $order = Order::first();
        $this->assertNotNull($order->order_number);
        $this->assertStringStartsWith('ORD-', $order->order_number);
        $this->assertNotNull($order->shipping_address_snapshot);
        $this->assertEquals('pending', $order->status->value);

        $vendorOrder = VendorOrder::first();
        $this->assertNotNull($vendorOrder->vendor_order_number);
        $this->assertEquals(10.0, (float) $vendorOrder->commission_rate);
        $this->assertEquals(108.0, (float) $vendorOrder->commission_amount);
        $this->assertEquals(972.0, (float) $vendorOrder->vendor_payable);

        $this->assertDatabaseHas('checkout_sessions', ['id' => $order->checkout_session_id, 'status' => 'completed']);
        $this->assertDatabaseHas('order_status_history', [
            'trackable_type' => Order::class,
            'trackable_id' => $order->id,
            'to_status' => 'pending',
        ]);
    }

    public function test_order_places_separate_vendor_orders(): void
    {
        $user = $this->customer();
        [$vendorA, , $productA] = $this->vendorWithProduct(price: 1000, tag: 'alpha');
        [$vendorB, , $productB] = $this->vendorWithProduct(price: 500, tag: 'beta');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $productA->uuid, 'quantity' => 1])
            ->assertOk();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $productB->uuid, 'quantity' => 1])
            ->assertOk();

        $address = $this->addressFor($user);
        $session = $this->actingAs($user, 'sanctum')->postJson('/api/v1/checkout/', [
            'shipping_address_id' => $address->uuid,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/', [
            'checkout_session_id' => $session->json('data.id'),
        ]);

        $response->assertCreated()
            ->assertJsonCount(2, 'data.vendor_orders');

        $this->assertDatabaseHas('orders', ['user_id' => $user->id, 'grand_total' => 1660.00]);
        $this->assertEquals(2, VendorOrder::count());
        $this->assertEquals(2, Order::first()->items()->count());
    }

    public function test_order_decrements_stock(): void
    {
        $user = $this->customer();
        [, , $product] = $this->vendorWithProduct(price: 500, quantity: 5);
        [$address, $sessionId] = $this->checkout($user, $product, qty: 3);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/', [
            'checkout_session_id' => $sessionId,
        ])->assertCreated();

        $this->assertDatabaseHas('products', ['id' => $product->id, 'quantity' => 2]);
    }

    public function test_cannot_place_order_with_insufficient_stock(): void
    {
        $user = $this->customer();
        [, , $product] = $this->vendorWithProduct(price: 500, quantity: 5);
        [$address, $sessionId] = $this->checkout($user, $product, qty: 3);

        $product->update(['quantity' => 2]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/', [
            'checkout_session_id' => $sessionId,
        ]);

        $response->assertStatus(409);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_cannot_place_order_from_another_users_session(): void
    {
        $user = $this->customer();
        $other = $this->customer();
        [, , $product] = $this->vendorWithProduct();
        [$address, $sessionId] = $this->checkout($user, $product);

        $this->actingAs($other, 'sanctum')
            ->postJson('/api/v1/orders/', ['checkout_session_id' => $sessionId])
            ->assertStatus(404);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_customer_can_list_and_view_orders(): void
    {
        $user = $this->customer();
        [, , $product] = $this->vendorWithProduct(price: 800);
        [$address, $sessionId] = $this->checkout($user, $product);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/', [
            'checkout_session_id' => $sessionId,
        ])->assertCreated();

        $list = $this->actingAs($user, 'sanctum')->getJson('/api/v1/orders/');
        $list->assertOk()->assertJsonCount(1, 'data');

        $orderId = $list->json('data.0.id');

        $this->actingAs($user, 'sanctum')->getJson("/api/v1/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.order_number', fn ($value) => is_string($value));
    }

    public function test_cannot_view_another_users_order(): void
    {
        $user = $this->customer();
        $other = $this->customer();
        [, , $product] = $this->vendorWithProduct();
        [$address, $sessionId] = $this->checkout($user, $product);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/', [
            'checkout_session_id' => $sessionId,
        ])->assertCreated();

        $this->actingAs($other, 'sanctum')->getJson("/api/v1/orders/".Order::first()->uuid)
            ->assertStatus(404);
    }

    public function test_customer_can_cancel_pending_order_and_stock_is_restored(): void
    {
        $user = $this->customer();
        [, , $product] = $this->vendorWithProduct(price: 600, quantity: 5);
        [$address, $sessionId] = $this->checkout($user, $product, qty: 2);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/', [
            'checkout_session_id' => $sessionId,
        ])->assertCreated();

        $orderId = Order::first()->uuid;

        $response = $this->actingAs($user, 'sanctum')->postJson("/api/v1/orders/{$orderId}/cancel", [
            'reason' => 'Changed my mind',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.can_cancel', false);

        $this->assertDatabaseHas('orders', ['uuid' => $orderId, 'status' => 'cancelled']);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'quantity' => 5]);
        $this->assertDatabaseHas('vendor_orders', [
            'order_id' => Order::first()->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_cannot_cancel_order_from_another_user(): void
    {
        $user = $this->customer();
        $other = $this->customer();
        [, , $product] = $this->vendorWithProduct();
        [$address, $sessionId] = $this->checkout($user, $product);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders/', [
            'checkout_session_id' => $sessionId,
        ])->assertCreated();

        $orderId = Order::first()->uuid;

        $this->actingAs($other, 'sanctum')
            ->postJson("/api/v1/orders/{$orderId}/cancel", ['reason' => 'nope'])
            ->assertStatus(404);

        $this->assertDatabaseHas('orders', ['uuid' => $orderId, 'status' => 'pending']);
    }

    public function test_guest_cannot_access_orders(): void
    {
        $this->getJson('/api/v1/orders/')->assertUnauthorized();
    }
}
