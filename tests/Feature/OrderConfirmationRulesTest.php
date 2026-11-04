<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Application\Mail\OrderConfirmationMail;
use App\Modules\Marketing\Application\Mail\OrderStatusMail;
use App\Modules\Marketing\Application\Services\NotificationDispatcher;
use App\Modules\Marketing\Infrastructure\Models\CustomerNotification;
use App\Modules\Order\Application\Services\OrderConfirmationSchedulerService;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Order\Presentation\Resources\OrderResource;
use App\Modules\Payment\Application\Services\RefundService;
use App\Modules\Payment\Application\Services\PaymentService;
use App\Modules\Payment\Domain\Contracts\PaymentProviderContract;
use App\Modules\Payment\Domain\Exceptions\PaymentProviderException;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Payment\Infrastructure\Models\Refund;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Enums\PaymentStatus;
use App\Modules\Shared\Domain\Enums\RefundStatus;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shipping\Application\Services\DeliveryService;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Application\Services\WalletService;
use App\Modules\Wallet\Infrastructure\Models\WalletTransaction;
use Carbon\Carbon;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
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
            'slug' => 'himalayan-store-'.Str::random(6),
            'status' => StoreStatus::ACTIVE,
        ]);

        $this->product = Product::create([
            'uuid' => (string) Str::uuid(),
            'vendor_id' => $this->vendor->id,
            'store_id' => $this->store->id,
            'name' => 'Singing Bowl',
            'slug' => 'singing-bowl-'.Str::random(6),
            'sku' => 'SKU-'.strtoupper(Str::random(8)),
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
            'email' => 'customer_'.Str::random(8).'@gosika.com',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'order_number' => 'ORD-'.strtoupper(Str::random(8)),
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
            'vendor_order_number' => 'VO-'.strtoupper(Str::random(8)),
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

        return [$order, $vendorOrder, $customer];
    }

    // ── 1. Customer cancellation succeeds during allowed window ─────────

    public function test_customer_cancellation_succeeds_during_allowed_window(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder();

        // Cancel 5 minutes after placement (within 15-minute window)
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(5));

        $response = $this->actingAs($customer)->postJson("/api/v1/orders/{$order->uuid}/cancel", [
            'reason' => 'Changed my mind',
        ]);

        $response->assertStatus(200);
        $this->assertEquals(OrderStatus::CANCELLED->value, $order->fresh()->status->value);
        $this->assertEquals(OrderStatus::CANCELLED->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals('Changed my mind', $order->fresh()->cancelled_reason);

        $this->assertSame(10, $this->product->fresh()->quantity);
    }

    public function test_cancelled_order_cannot_start_or_complete_payment(): void
    {
        [$order, , $customer] = $this->createOrder(OrderStatus::CANCELLED);
        $payment = Payment::create([
            'payment_number' => 'PAY-'.strtoupper(Str::random(10)),
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'amount' => $order->grand_total,
            'currency' => 'NPR',
            'method' => 'esewa',
            'provider' => 'esewa',
            'status' => PaymentStatus::FAILED,
            'initiated_at' => now(),
        ]);
        $paymentService = app(PaymentService::class);

        try {
            $paymentService->initiate($order, $customer, 'esewa');
            $this->fail('Cancelled order payment initiation should be rejected.');
        } catch (PaymentProviderException $exception) {
            $this->assertSame('This order has been cancelled and cannot be paid.', $exception->getMessage());
        }

        try {
            $paymentService->markPaid($payment);
            $this->fail('Cancelled order payment callback should be rejected.');
        } catch (PaymentProviderException $exception) {
            $this->assertSame('This order has been cancelled and cannot be paid.', $exception->getMessage());
        }

        $this->assertSame(PaymentStatus::FAILED, $payment->fresh()->status);
        $this->assertSame(OrderStatus::CANCELLED, $order->fresh()->status);
    }

    public function test_online_order_only_gets_delivery_otp_after_payment_is_confirmed(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::PAYMENT_PENDING, false);
        $order->update(['payment_status' => OrderPaymentStatus::PENDING]);
        $vendorOrder->update(['status' => OrderStatus::PENDING]);

        $resourceBeforePayment = OrderResource::make($order->fresh())->toArray(request());
        $this->assertNull($resourceBeforePayment['delivery_otp']);
        Mail::fake();

        $payment = Payment::create([
            'payment_number' => 'PAY-'.strtoupper(Str::random(10)),
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'amount' => $order->grand_total,
            'currency' => 'NPR',
            'method' => 'esewa',
            'provider' => 'esewa',
            'status' => PaymentStatus::PROCESSING,
            'initiated_at' => now(),
        ]);

        app(PaymentService::class)->markPaid($payment);
        app(PaymentService::class)->markPaid($payment->fresh());

        $paidOrder = $order->fresh();
        $this->assertSame(OrderPaymentStatus::PAID, $paidOrder->payment_status);
        $this->assertSame(OrderStatus::CONFIRMED, $paidOrder->status);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $paidOrder->meta['delivery_otp']);
        $this->assertSame($paidOrder->meta['delivery_otp'], $vendorOrder->fresh()->meta['delivery_otp']);
        $this->assertSame(1, CustomerNotification::query()->where('user_id', $customer->id)->count());
        $this->assertSame(
            OrderStatus::CONFIRMED->value,
            CustomerNotification::query()->where('user_id', $customer->id)->firstOrFail()->data['status']
        );
        Mail::assertSent(OrderConfirmationMail::class, function (OrderConfirmationMail $mail) use ($order): bool {
            $html = $mail->render();

            return str_contains($html, $order->order_number)
                && str_contains($html, 'Payment received')
                && str_contains($html, 'awaiting seller acceptance');
        });
        Mail::assertNotSent(OrderStatusMail::class);
    }

    public function test_pending_online_order_sends_accurate_payment_pending_notification_and_email(): void
    {
        [$order, , $customer] = $this->createOrder(OrderStatus::PAYMENT_PENDING, false);
        $order->update(['payment_status' => OrderPaymentStatus::PENDING]);
        Mail::fake();

        $dispatcher = app(NotificationDispatcher::class);
        $dispatcher->orderPlaced($order->fresh());
        $dispatcher->orderConfirmation($order->fresh());

        $notification = CustomerNotification::query()->where('user_id', $customer->id)->firstOrFail();
        $this->assertSame('payment', $notification->type);
        $this->assertSame('Payment pending for order '.$order->order_number, $notification->title);
        $this->assertSame('payment_pending', $notification->data['status']);
        $this->assertSame('pending', $notification->data['payment_status']);
        $this->assertSame('order_placed', $notification->data['event']);

        Mail::assertSent(OrderStatusMail::class);
        $statusMail = Mail::sent(OrderStatusMail::class)->first();
        $statusEmailHtml = $statusMail->render();
        $this->assertStringContainsString($order->order_number, $statusEmailHtml);
        $this->assertStringContainsString('Singing Bowl', $statusEmailHtml);
        $this->assertStringContainsString('pending', strtolower($statusEmailHtml));
        Mail::assertNotSent(OrderConfirmationMail::class);
    }

    public function test_vendor_acceptance_does_not_confirm_or_notify_an_unpaid_online_order(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::PAYMENT_PENDING, false);
        $order->update(['payment_status' => OrderPaymentStatus::PENDING]);
        $vendorOrder->update(['status' => OrderStatus::PENDING]);
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addMinutes(20));
        Mail::fake();

        app(DeliveryService::class)->vendorAccept($vendorOrder, $this->vendorUser);

        $pendingOrder = $order->fresh();
        $this->assertSame(OrderStatus::PAYMENT_PENDING, $pendingOrder->status);
        $this->assertNull($pendingOrder->confirmed_at);
        $this->assertSame(0, CustomerNotification::query()->where('user_id', $customer->id)->count());
        Mail::assertNotSent(OrderConfirmationMail::class);
        Mail::assertNotSent(OrderStatusMail::class);
    }

    public function test_verified_esewa_cancellation_cancels_order_without_changing_stock(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::PAYMENT_PENDING, false);
        $order->update(['payment_status' => OrderPaymentStatus::PENDING]);
        $vendorOrder->update(['status' => OrderStatus::PENDING]);

        $payment = Payment::create([
            'payment_number' => 'PAY-'.strtoupper(Str::random(10)),
            'order_id' => $order->id,
            'user_id' => $customer->id,
            'amount' => $order->grand_total,
            'currency' => 'NPR',
            'method' => 'esewa',
            'provider' => 'esewa',
            'status' => PaymentStatus::PROCESSING,
            'initiated_at' => now(),
        ]);

        $paymentService = app(PaymentService::class);
        $paymentService->setProvider('esewa', new class implements PaymentProviderContract
        {
            public function name(): string
            {
                return 'esewa';
            }

            public function initiate(array $payload): array
            {
                return [];
            }

            public function lookup(string $reference, ?array $params = null): array
            {
                return ['status' => 'CANCELED'];
            }
        });

        $paymentService->verifyEsewaOrderStatus($payment);

        $this->assertSame(PaymentStatus::FAILED, $payment->fresh()->status);
        $this->assertSame(OrderStatus::CANCELLED, $order->fresh()->status);
        $this->assertSame(OrderStatus::CANCELLED, $vendorOrder->fresh()->status);
        $this->assertSame(10, $this->product->fresh()->quantity);
        $this->assertNull(OrderResource::make($order->fresh())->toArray(request())['delivery_otp']);
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
        // Advance 25 hours (past 24h deadline)
        Carbon::setTestNow(Carbon::parse($order->placed_at)->addHours(25));

        $scheduler = app(OrderConfirmationSchedulerService::class);
        $results = $scheduler->run();

        $this->assertEquals(1, $results['expired_cancelled']);
        $this->assertEquals(OrderStatus::CANCELLED->value, $vendorOrder->fresh()->status->value);
        $this->assertEquals(OrderStatus::CANCELLED->value, $order->fresh()->status->value);
        $this->assertEquals('Vendor did not confirm within the allowed time', $order->fresh()->cancelled_reason);

        $this->assertSame(10, $this->product->fresh()->quantity);
    }

    public function test_delivered_order_becomes_completed_after_return_window_expires(): void
    {
        [$order] = $this->createOrder(OrderStatus::DELIVERED);
        $order->update(['completed_at' => now()->subDays(8)]);
        Setting::set('return.window_days', 7, 'return', 'integer', true);

        $scheduler = app(OrderConfirmationSchedulerService::class);
        $this->assertSame(1, $scheduler->processExpiredReturnWindows());

        $this->assertSame(OrderStatus::COMPLETED, $order->fresh()->status);
        $this->assertDatabaseHas('order_status_history', [
            'trackable_type' => Order::class,
            'trackable_id' => $order->id,
            'from_status' => OrderStatus::DELIVERED->value,
            'to_status' => OrderStatus::COMPLETED->value,
            'reason' => 'The return and refund window has expired.',
        ]);
        $this->assertSame(0, $scheduler->processExpiredReturnWindows());
    }

    public function test_delivered_order_without_completed_at_completes_after_assignment_return_window_expires(): void
    {
        Setting::set('return.window_days', 7, 'return', 'integer', true);
        [$order, $vendorOrder] = $this->createOrder(OrderStatus::DELIVERED);
        $order->update(['completed_at' => null]);
        $partner = DeliveryPartner::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->vendorUser->id,
            'name' => 'Delivery Partner',
            'phone' => '9800000098',
            'status' => 'approved',
        ]);
        DeliveryAssignment::create([
            'uuid' => (string) Str::uuid(),
            'vendor_order_id' => $vendorOrder->id,
            'delivery_partner_id' => $partner->id,
            'status' => DeliveryStatus::DELIVERED,
            'delivery_fee' => 100,
            'delivered_at' => now()->subDays(8),
        ]);

        $scheduler = app(OrderConfirmationSchedulerService::class);
        $this->assertSame(1, $scheduler->processExpiredReturnWindows());
        $this->assertSame(OrderStatus::COMPLETED, $order->fresh()->status);
    }

    public function test_return_request_window_starts_at_delivery_and_expires_after_configured_days(): void
    {
        Setting::set('return.window_days', 7, 'return', 'integer', true);
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::DELIVERED);
        $deliveredAt = now()->subDays(2)->startOfSecond();
        $order->update(['completed_at' => $deliveredAt]);
        $vendorOrder->update(['status' => OrderStatus::DELIVERED]);
        $item = $order->items()->firstOrFail();

        $this->actingAs($customer)
            ->getJson('/api/v1/orders/'.$order->uuid)
            ->assertOk()
            ->assertJsonPath('data.can_request_return', true)
            ->assertJsonPath('data.return_window_expires_at', $deliveredAt->copy()->addDays(7)->toISOString());

        $this->actingAs($customer)
            ->postJson('/api/v1/customer/returns', [
                'order_id' => $order->uuid,
                'order_item_id' => $item->uuid,
                'reason_type' => 'damaged',
                'reason' => 'The item arrived damaged.',
                'quantity' => 1,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('return_requests', [
            'order_id' => $order->id,
            'order_item_id' => $item->id,
            'window_expires_at' => $deliveredAt->copy()->addDays(7)->toDateTimeString(),
            'refund_amount' => 1200.00,
        ]);

        [$expiredOrder, $expiredVendorOrder, $expiredCustomer] = $this->createOrder(OrderStatus::COMPLETED);
        $expiredOrder->update(['completed_at' => now()->subDays(8)]);
        $expiredVendorOrder->update(['status' => OrderStatus::DELIVERED]);
        $expiredItem = $expiredOrder->items()->firstOrFail();

        $this->actingAs($expiredCustomer)
            ->postJson('/api/v1/customer/returns', [
                'order_id' => $expiredOrder->uuid,
                'order_item_id' => $expiredItem->uuid,
                'reason_type' => 'damaged',
                'reason' => 'The item arrived damaged.',
                'quantity' => 1,
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'The return and refund window for this order has expired.');
    }

    public function test_delivered_orders_without_completed_at_use_delivery_assignment_date_for_return_window(): void
    {
        Setting::set('return.window_days', 7, 'return', 'integer', true);
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::DELIVERED);
        $deliveredAt = now()->subDays(2)->startOfSecond();
        $order->update(['completed_at' => null]);
        $vendorOrder->update(['status' => OrderStatus::DELIVERED]);

        $partner = DeliveryPartner::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->vendorUser->id,
            'name' => 'Delivery Partner',
            'phone' => '9800000099',
            'status' => 'approved',
        ]);
        DeliveryAssignment::create([
            'uuid' => (string) Str::uuid(),
            'vendor_order_id' => $vendorOrder->id,
            'delivery_partner_id' => $partner->id,
            'status' => DeliveryStatus::DELIVERED,
            'delivery_fee' => 100,
            'delivered_at' => $deliveredAt,
        ]);

        $this->actingAs($customer)
            ->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonFragment([
                'can_request_return' => true,
                'return_window_expires_at' => $deliveredAt->copy()->addDays(7)->toISOString(),
            ]);

        $item = $order->items()->firstOrFail();
        $this->actingAs($customer)
            ->postJson('/api/v1/customer/returns', [
                'order_id' => $order->uuid,
                'order_item_id' => $item->uuid,
                'reason_type' => 'damaged',
                'reason' => 'The item arrived damaged.',
                'quantity' => 1,
            ])
            ->assertCreated();
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

    public function test_refund_amount_is_linked_and_financial_status_updates_only_when_refunded(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::DELIVERED, isCod: false);
        $item = $order->items()->firstOrFail();
        $payment = Payment::create([
            'payment_number' => 'PAY-'.strtoupper(Str::random(10)),
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'user_id' => $customer->id,
            'amount' => $order->grand_total,
            'currency' => 'NPR',
            'method' => 'esewa',
            'provider' => 'esewa',
            'status' => PaymentStatus::PAID,
            'initiated_at' => now(),
            'verified_at' => now(),
        ]);
        $return = ReturnRequest::create([
            'return_number' => 'RTN-'.strtoupper(Str::random(8)),
            'user_id' => $customer->id,
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'order_item_id' => $item->id,
            'store_id' => $this->store->id,
            'vendor_id' => $this->vendor->id,
            'reason_type' => 'damaged',
            'reason' => 'Item arrived damaged',
            'quantity' => 1,
            'refund_amount' => 1200,
            'status' => ReturnStatus::APPROVED,
        ]);

        $service = app(RefundService::class);
        $refund = $service->create($payment, $this->adminUser, 100, 'Approved return', null, $return);

        $this->assertSame($return->id, $refund->return_request_id);
        $this->assertSame($item->id, $refund->order_item_id);
        $this->assertSame('100.00', $return->fresh()->refund_amount);
        $this->assertSame(ReturnStatus::REFUND_PENDING, $return->fresh()->status);

        $service->approve($this->adminUser, $refund);
        $this->assertSame(PaymentStatus::PAID, $payment->fresh()->status);
        $this->assertSame(OrderPaymentStatus::PAID, $order->fresh()->payment_status);

        $service->updateStatus($this->adminUser, $refund, RefundStatus::REFUNDED);

        $this->assertSame(PaymentStatus::PARTIALLY_REFUNDED, $payment->fresh()->status);
        $this->assertSame(OrderPaymentStatus::PARTIALLY_REFUNDED, $order->fresh()->payment_status);
        $this->assertSame(ReturnStatus::REFUNDED, $return->fresh()->status);

        $this->actingAs($customer)
            ->getJson("/api/v1/orders/{$order->uuid}")
            ->assertOk()
            ->assertJsonPath('data.grand_total', '2500.00')
            ->assertJsonPath('data.refunded_amount', '100.00')
            ->assertJsonPath('data.net_total', '2400.00');
    }

    public function test_refund_cannot_exceed_the_returned_quantity_value(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::DELIVERED, isCod: false);
        $item = $order->items()->firstOrFail();
        $payment = Payment::create([
            'payment_number' => 'PAY-'.strtoupper(Str::random(10)),
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'user_id' => $customer->id,
            'amount' => $order->grand_total,
            'currency' => 'NPR',
            'method' => 'esewa',
            'provider' => 'esewa',
            'status' => PaymentStatus::PAID,
            'initiated_at' => now(),
            'verified_at' => now(),
        ]);
        $return = ReturnRequest::create([
            'return_number' => 'RTN-'.strtoupper(Str::random(8)),
            'user_id' => $customer->id,
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'order_item_id' => $item->id,
            'store_id' => $this->store->id,
            'vendor_id' => $this->vendor->id,
            'reason_type' => 'damaged',
            'reason' => 'Item arrived damaged',
            'quantity' => 1,
            'refund_amount' => 1200,
            'status' => ReturnStatus::APPROVED,
        ]);

        try {
            app(RefundService::class)->create($payment, $this->adminUser, 1200.01, 'Over limit', null, $return);
            $this->fail('A refund above the returned quantity value should be rejected.');
        } catch (DomainException $exception) {
            $this->assertSame(422, $exception->getStatusCode());
        }

        $this->assertSame(0, Refund::query()->count());
    }

    public function test_admin_can_create_refund_using_the_selected_return_amount(): void
    {
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::DELIVERED, isCod: true);
        $item = $order->items()->firstOrFail();
        Payment::create([
            'payment_number' => 'PAY-'.strtoupper(Str::random(10)),
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'user_id' => $customer->id,
            'amount' => $order->grand_total,
            'currency' => 'NPR',
            'method' => 'cod',
            'provider' => 'manual',
            'status' => PaymentStatus::PAID,
            'initiated_at' => now(),
            'verified_at' => now(),
        ]);
        $return = ReturnRequest::create([
            'return_number' => 'RTN-'.strtoupper(Str::random(8)),
            'user_id' => $customer->id,
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'order_item_id' => $item->id,
            'store_id' => $this->store->id,
            'vendor_id' => $this->vendor->id,
            'reason_type' => 'damaged',
            'reason' => 'Item arrived damaged',
            'quantity' => 1,
            'refund_amount' => 1200,
            'status' => ReturnStatus::APPROVED,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/orders/returns/{$return->uuid}/refund", [
                'method' => 'cod',
                'amount' => '321.50',
                'notes' => 'Refund verified by admin',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.amount', '321.50');
        $this->assertDatabaseHas('refunds', [
            'return_request_id' => $return->id,
            'order_item_id' => $item->id,
            'amount' => 321.50,
        ]);
        $this->assertSame('321.50', $return->fresh()->refund_amount);
        $this->assertSame(ReturnStatus::REFUND_PENDING, $return->fresh()->status);
    }

    public function test_completed_refunds_reduce_vendor_settlement_and_pending_wallet_balance(): void
    {
        Setting::set('return.window_days', 7, 'return', 'integer', true);
        [$order, $vendorOrder, $customer] = $this->createOrder(OrderStatus::DELIVERED, isCod: false);
        $order->update(['completed_at' => now()->subDays(10)]);
        $vendorOrder->update([
            'status' => OrderStatus::DELIVERED,
            'grand_total' => 2500,
            'commission_rate' => 8,
            'commission_amount' => 200,
            'vendor_payable' => 2300,
        ]);
        $payment = Payment::create([
            'payment_number' => 'PAY-'.strtoupper(Str::random(10)),
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'user_id' => $customer->id,
            'amount' => 2500,
            'currency' => 'NPR',
            'method' => 'esewa',
            'provider' => 'esewa',
            'status' => PaymentStatus::PAID,
            'initiated_at' => now(),
            'verified_at' => now(),
        ]);
        $refund = Refund::create([
            'refund_number' => 'REF-'.strtoupper(Str::random(8)),
            'payment_id' => $payment->id,
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'amount' => 100,
            'status' => RefundStatus::REFUNDED,
            'completed_at' => now(),
        ]);

        $settlement = app(WalletService::class)->settleVendor(
            $this->vendor,
            now()->subDays(30),
            now()
        );

        $this->assertSame('100.00', $settlement->refunds_total);
        $this->assertSame('2200.00', $settlement->net_payable);
        $wallet = app(WalletService::class)->walletForVendor($this->vendor);
        $this->assertSame('2200.00', $wallet->balance);
        $this->assertSame('2200.00', $wallet->pending_balance);
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'transaction_type' => 'debit_refund',
            'reference_type' => 'refund',
            'reference_id' => $refund->id,
            'balance_before' => 2300,
            'balance_after' => 2200,
        ]);
    }
}
