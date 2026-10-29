<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Application\Services\OrderConfirmationSchedulerService;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Carbon\Carbon;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderConfirmationRulesTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $vendorUser;
    protected Vendor $vendor;
    protected Store $store;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);

        // Super Admin
        $this->adminUser = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@gosika.com',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $this->adminUser->assignRole(Roles::SUPER_ADMIN);

        // Vendor Admin
        $this->vendorUser = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Vendor',
            'last_name' => 'Seller',
            'email' => 'vendor@gosika.com',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $this->vendorUser->assignRole(Roles::VENDOR_ADMIN);

        $this->vendor = Vendor::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->vendorUser->id,
            'company_name' => 'Himalayan Handicrafts',
            'business_email' => 'art@gosika.com',
            'business_phone' => '9800000010',
            'status' => VendorStatus::APPROVED,
        ]);

        $this->store = Store::create([
            'uuid' => (string) Str::uuid(),
            'vendor_id' => $this->vendor->id,
            'name' => 'Himalayan Store',
            'slug' => 'himalayan-store-' . Str::random(6),
            'status' => StoreStatus::ACTIVE,
        ]);

        $this->product = Product::create([
            'uuid' => (string) Str::uuid(),
            'vendor_id' => $this->vendor->id,
            'store_id' => $this->store->id,
            'name' => 'Singing Bowl',
            'slug' => 'singing-bowl-' . Str::random(6),
            'sku' => 'SKU-' . strtoupper(Str::random(8)),
            'price' => 1200.00,
            'quantity' => 10,
            'stock_status' => 'in_stock',
            'status' => 'published',
        ]);

        // Default admin settings
        Setting::set('order.cancellation_window_minutes', 15, 'orders', 'integer', true);
        Setting::set('order.vendor_confirmation_deadline_hours', 24, 'orders', 'integer', true);
        Setting::set('order.auto_confirmation_enabled', false, 'orders', 'boolean', true);
        Setting::set('order.auto_confirmation_minutes', 30, 'orders', 'integer', true);
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    protected function createOrder(
        OrderStatus $status = OrderStatus::PENDING,
        bool $isCod = true,
        ?Carbon $placedAt = null,
        int $qty = 2
    ): array {
        $now = $placedAt ?? now();

        $customer = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Sital',
            'last_name' => 'Mahato',
            'email' => 'customer_' . Str::random(8) . '@gosika.com',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'user_id' => $customer->id,
            'payment_method' => $isCod ? PaymentMethod::COD->value : 'esewa',
            'payment_status' => $isCod ? OrderPaymentStatus::PENDING : OrderPaymentStatus::PAID,
            'status' => $status,
            'subtotal' => 2400.00,
            'delivery_charge' => 100.00,
            'grand_total' => 2500.00,
            'currency' => 'NPR',
            'placed_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $vendorOrder = VendorOrder::create([
            'uuid' => (string) Str::uuid(),
            'vendor_order_number' => 'VO-' . strtoupper(Str::random(8)),
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'store_id' => $this->store->id,
            'status' => $status,
            'delivery_status' => 'pending',
            'items_subtotal' => 2400.00,
            'delivery_charge' => 100.00,
            'grand_total' => 2500.00,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $item = OrderItem::create([
            'uuid' => (string) Str::uuid(),
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'vendor_id' => $this->vendor->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'quantity' => $qty,
            'unit_price' => 1200.00,
            'line_total' => 2400.00,
        ]);

        // Deduct initial stock for test realism
        $this->product->decrement('quantity', $qty);

        return [$order, $vendorOrder, $customer];
    }

    // ── 1. Customer cancellation succeeds during allowed window ─────────

    public function test_customer_cancellation_succeeds_during_allowed_window(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder();

        $initialProductQty = $this->product->fresh()->quantity; // 10 - 2 = 8

        // Cancel 5 minutes after placement (within 15-minute window)
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(5));

        $response = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->uuid}/cancel", [
            'reason' => 'Changed my mind',
        ]);

        $response->assertStatus(200);
        $this->assertEquals(OrderStatus::CANCELLED->value, $order->fresh()->status->value);
        $this->assertEquals(OrderStatus::CANCELLED->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals('Changed my mind', $order->fresh()->cancelled_reason);

        // Stock restored exactly once (+2)
        $this->assertEquals($initialProductQty + 2, $this->product->fresh()->quantity);
    }

    // ── 2. Cancellation with "Other" requires explanation ──────────────

    public function test_cancellation_with_other_requires_text_explanation(): void
    {
        [$order, , $customer] = $this->createOrder();

        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(5));

        // Missing explanation
        $res = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->uuid}/cancel", [
            'reason' => 'Other',
        ]);
        $res->assertStatus(422);

        // With valid explanation
        $validRes = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->uuid}/cancel", [
            'reason' => 'Other',
            'explanation' => 'Emergency travel plans came up suddenly.',
        ]);
        $validRes->assertStatus(200);
        $this->assertStringContainsString('Emergency travel plans', $order->fresh()->cancelled_reason);
    }

    // ── 3. Customer cancellation rejected after window expires ──────────

    public function test_customer_cancellation_rejected_after_cancellation_window(): void
    {
        [$order, , $customer] = $this->createOrder();

        // Advance 16 minutes (15 min window has expired)
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(16));

        $res = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->uuid}/cancel", [
            'reason' => 'Changed my mind',
        ]);

        $res->assertStatus(422);
        $this->assertStringContainsString('cancellation window', strtolower($res->json('message')));
        $this->assertEquals(OrderStatus::PENDING->value, $order->fresh()->status->value);
    }

    // ── 4. Vendor confirmation is blocked during cancellation window ────

    public function test_vendor_confirmation_blocked_during_cancellation_window(): void
    {
        [, $vendorOrder] = $this->createOrder();

        // 5 minutes after placement -> vendor tries to accept
        Carbon::setTestNow(Carbon::parse($vendorOrder->created_at)->addMinutes(5));

        $res = $this->actingAs($this->vendorUser)->postJson("/api/v1/vendor/orders/{$vendorOrder->uuid}/accept");

        $res->assertStatus(422);
        $this->assertStringContainsString('cancellation window', strtolower($res->json('message')));
        $this->assertEquals(OrderStatus::PENDING->value, $vendorOrder->fresh()->status->value);
    }

    // ── 5. Manual confirmation succeeds after window & before deadline ──

    public function test_manual_confirmation_succeeds_after_window_and_before_deadline(): void
    {
        [$order, $vendorOrder] = $this->createOrder();

        // 20 minutes after placement (cancellation window 15m expired, deadline 24h intact)
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(20));

        $res = $this->actingAs($this->vendorUser)->postJson("/api/v1/vendor/orders/{$vendorOrder->uuid}/accept");

        $res->assertStatus(200);
        $this->assertEquals(OrderStatus::ACCEPTED->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals(OrderStatus::CONFIRMED->value, $order->fresh()->status->value);
        $this->assertEquals('manual', $vendorOrder->fresh()->meta['confirmation_method']);
    }

    // ── 6. Customer cancellation blocked once order is confirmed ────────

    public function test_customer_cancellation_blocked_after_order_is_confirmed(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder();

        // Vendor confirms after window
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(20));
        $this->actingAs($this->vendorUser)->postJson("/api/v1/vendor/orders/{$vendorOrder->uuid}/accept");

        // Customer attempts to cancel confirmed order
        $res = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->uuid}/cancel", [
            'reason' => 'Changed my mind',
        ]);

        $res->assertStatus(422);
        $this->assertEquals(
            'This order has been confirmed and can no longer be cancelled. Please contact support for assistance.',
            $res->json('message')
        );
        $this->assertEquals(OrderStatus::CONFIRMED->value, $order->fresh()->status->value);
    }

    // ── 7. Automatic confirmation occurs at configured duration ─────────

    public function test_automatic_confirmation_occurs_at_configured_duration_when_enabled(): void
    {
        Setting::set('order.auto_confirmation_enabled', true, 'orders', 'boolean', true);
        Setting::set('order.auto_confirmation_minutes', 30, 'orders', 'integer', true);

        [$order, $vendorOrder] = $this->createOrder(isCod: true);

        // Advance 32 minutes (past 15m cancellation window and past 30m auto-confirm duration)
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(32));

        $scheduler = app(OrderConfirmationSchedulerService::class);
        $results = $scheduler->run();

        $this->assertEquals(1, $results['auto_confirmed']);
        $this->assertEquals(OrderStatus::ACCEPTED->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals(OrderStatus::CONFIRMED->value, $order->fresh()->status->value);
        $this->assertEquals('automatic', $vendorOrder->fresh()->meta['confirmation_method']);
    }

    // ── 8. Automatic confirmation blocked when disabled ─────────────────

    public function test_automatic_confirmation_does_not_occur_when_disabled(): void
    {
        Setting::set('order.auto_confirmation_enabled', false, 'orders', 'boolean', true);

        [$order, $vendorOrder] = $this->createOrder(isCod: true);

        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(35));

        $scheduler = app(OrderConfirmationSchedulerService::class);
        $results = $scheduler->run();

        $this->assertEquals(0, $results['auto_confirmed']);
        $this->assertEquals(OrderStatus::PENDING->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals(OrderStatus::PENDING->value, $order->fresh()->status->value);
    }

    // ── 9. Automatic confirmation blocked for unpaid online orders ──────

    public function test_automatic_confirmation_blocked_for_unpaid_online_orders(): void
    {
        Setting::set('order.auto_confirmation_enabled', true, 'orders', 'boolean', true);
        Setting::set('order.auto_confirmation_minutes', 30, 'orders', 'integer', true);

        // Create online order with PENDING payment
        [$order, $vendorOrder] = $this->createOrder(isCod: false);
        $order->payment_status = OrderPaymentStatus::PENDING;
        $order->save();

        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(35));

        $scheduler = app(OrderConfirmationSchedulerService::class);
        $results = $scheduler->run();

        // Must not auto-confirm until paid
        $this->assertEquals(0, $results['auto_confirmed']);
        $this->assertEquals(OrderStatus::PENDING->value, $vendorOrder->fresh()->status->value);
    }

    // ── 10. Auto-cancel when maximum confirmation deadline expires ──────

    public function test_orders_cancelled_when_vendor_deadline_expires(): void
    {
        Setting::set('order.vendor_confirmation_deadline_hours', 24, 'orders', 'integer', true);

        [$order, $vendorOrder] = $this->createOrder();
        $initialStock = $this->product->fresh()->quantity; // 8

        // Advance 25 hours (past 24h deadline)
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addHours(25));

        $scheduler = app(OrderConfirmationSchedulerService::class);
        $results = $scheduler->run();

        $this->assertEquals(1, $results['expired_cancelled']);
        $this->assertEquals(OrderStatus::CANCELLED->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals(OrderStatus::CANCELLED->value, $order->fresh()->status->value);
        $this->assertEquals('Vendor did not confirm within the allowed time', $order->fresh()->cancelled_reason);

        // Stock restored back to 10
        $this->assertEquals($initialStock + 2, $this->product->fresh()->quantity);
    }

    // ── 11. Admin settings validation enforces precedence ───────────────

    public function test_admin_settings_validation_enforces_precedence_rules(): void
    {
        // 1. auto_confirmation_minutes cannot be less than cancellation_window
        $res = $this->actingAs($this->adminUser)->putJson('/api/v1/admin/settings/orders', [
            'cancellation_window_minutes' => 20,
            'vendor_confirmation_deadline_hours' => 24,
            'auto_confirmation_enabled' => true,
            'auto_confirmation_minutes' => 10, // Invalid: 10 < 20
        ]);
        $res->assertStatus(422);
        $this->assertStringContainsString('cannot be less than', $res->json('message'));

        // 2. auto_confirmation_minutes cannot exceed deadline
        $res2 = $this->actingAs($this->adminUser)->putJson('/api/v1/admin/settings/orders', [
            'cancellation_window_minutes' => 15,
            'vendor_confirmation_deadline_hours' => 2, // 120 minutes
            'auto_confirmation_enabled' => true,
            'auto_confirmation_minutes' => 150, // Invalid: 150 >= 120
        ]);
        $res2->assertStatus(422);
        $this->assertStringContainsString('strictly less than', $res2->json('message'));

        // 3. Valid settings save successfully
        $res3 = $this->actingAs($this->adminUser)->putJson('/api/v1/admin/settings/orders', [
            'cancellation_window_minutes' => 15,
            'vendor_confirmation_deadline_hours' => 24,
            'auto_confirmation_enabled' => true,
            'auto_confirmation_minutes' => 45,
        ]);
        $res3->assertStatus(200);

        // Verify retrieval via getOrders
        $getRes = $this->actingAs($this->adminUser)->getJson('/api/v1/admin/settings/orders');
        $getRes->assertStatus(200);
        $this->assertEquals(45, $getRes->json('data.auto_confirmation_minutes'));
    }

    // ── 12. Vendor can configure order confirmation settings in store ───

    public function test_vendor_can_configure_order_confirmation_settings_in_store(): void
    {
        $res = $this->actingAs($this->vendorUser)->putJson("/api/v1/vendor/stores/{$this->store->uuid}", [
            'name' => $this->store->name,
            'settings' => [
                'order_confirmation_mode' => 'automatic',
                'auto_confirmation_minutes' => 30,
                'auto_ready_for_pickup' => true,
                'estimated_prep_time' => '15 mins',
                'pickup_instructions' => 'Ring warehouse doorbell at rear entrance.',
            ],
        ]);

        $res->assertStatus(200);
        $freshStore = $this->store->fresh();
        $this->assertEquals('automatic', $freshStore->settings['order_confirmation_mode']);
        $this->assertEquals(30, $freshStore->settings['auto_confirmation_minutes']);
        $this->assertTrue($freshStore->settings['auto_ready_for_pickup']);
        $this->assertEquals('15 mins', $freshStore->settings['estimated_prep_time']);
        $this->assertEquals('Ring warehouse doorbell at rear entrance.', $freshStore->settings['pickup_instructions']);
    }

    // ── 13. Store automatic confirmation and auto ready for pickup ──────

    public function test_store_automatic_confirmation_and_auto_ready_for_pickup(): void
    {
        // Global platform auto-confirmation is FALSE
        Setting::set('order.auto_confirmation_enabled', false, 'orders', 'boolean', true);

        // Store enables automatic confirmation and auto_ready_for_pickup
        $this->store->update([
            'settings' => [
                'order_confirmation_mode' => 'automatic',
                'auto_confirmation_minutes' => 15,
                'auto_ready_for_pickup' => true,
            ],
        ]);

        [$order, $vendorOrder] = $this->createOrder(isCod: true);

        // 16 minutes after placement (cancellation window 15m passed, auto-confirm 15m passed)
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(16));

        $scheduler = app(OrderConfirmationSchedulerService::class);
        $results = $scheduler->run();

        $this->assertEquals(1, $results['auto_confirmed']);
        // Order directly transitions to READY_FOR_PICKUP because auto_ready_for_pickup is true
        $this->assertEquals(OrderStatus::READY_FOR_PICKUP->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals(OrderStatus::READY_FOR_PICKUP->value, $order->fresh()->status->value);
        $this->assertEquals('automatic', $vendorOrder->fresh()->meta['confirmation_method']);
    }

    // ── 14. Manual confirmation with auto ready for pickup ──────────────

    public function test_manual_vendor_confirmation_with_auto_ready_for_pickup(): void
    {
        $this->store->update([
            'settings' => [
                'order_confirmation_mode' => 'manual',
                'auto_ready_for_pickup' => true,
            ],
        ]);

        [$order, $vendorOrder] = $this->createOrder(isCod: true);

        // Accept after cancellation window
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(20));

        $res = $this->actingAs($this->vendorUser)->postJson("/api/v1/vendor/orders/{$vendorOrder->uuid}/accept");
        $res->assertStatus(200);

        // Vendor accepted, and auto_ready_for_pickup automatically advanced to READY_FOR_PICKUP
        $this->assertEquals(OrderStatus::READY_FOR_PICKUP->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals(OrderStatus::READY_FOR_PICKUP->value, $order->fresh()->status->value);
    }
}
