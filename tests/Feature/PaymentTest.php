<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
        $this->seed(\Database\Seeders\SettingsSeeder::class);

        Setting::set('payment.khalti_enabled', 'true', 'payment', 'boolean');

        Config::set('services.khalti.base_url', 'https://dev.khalti.com/api/v2');
        Config::set('services.khalti.secret_key', 'test_secret_key');
        Config::set('services.khalti.return_url', 'https://gosika.test/payment/callback');
        Config::set('services.khalti.website_url', 'https://gosika.test');
    }

    protected function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::CUSTOMER);

        return $user;
    }

    protected function vendorWithProduct(): array
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Payment Vendor',
            'business_email' => 'pay@vendor.com.np',
            'status' => VendorStatus::APPROVED,
        ]);

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Payment Store',
            'slug' => 'payment-store-'.$vendor->id,
            'contact_email' => 'pay@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        $product = Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Payment Product',
            'slug' => 'payment-product-'.$vendor->id,
            'sku' => 'PAY-'.$vendor->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 20,
            'low_stock_threshold' => 2,
            'price' => 1000.00,
            'tax_rate' => 0,
        ]);

        return [$vendor, $store, $product];
    }

    protected function checkout(User $user, Product $product, string $method = 'khalti'): array
    {
        $address = CustomerAddress::query()->create([
            'user_id' => $user->id,
            'address_type' => 'shipping',
            'label' => 'Home',
            'full_name' => 'Payment Customer',
            'phone' => '9812345678',
            'address_line_1' => 'Baluwatar',
            'postal_code' => '44600',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => 1])
            ->assertOk();

        $session = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/checkout/', ['shipping_address_id' => $address->uuid, 'payment_method' => $method]);

        return [$address, $session->json('data.id')];
    }

    protected function placeOrder(User $user, string $sessionId): string
    {
        $order = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/orders', ['checkout_session_id' => $sessionId, 'payment_method' => 'khalti']);

        return $order->json('data.id');
    }

    protected function fakeKhaltiInitiate(): void
    {
        Http::fake([
            'dev.khalti.com/api/v2/epayment/initiate/*' => Http::response([
                'pidx' => 'PIDX-TEST-123',
                'payment_url' => 'https://pay.khalti.com/?pidx=PIDX-TEST-123',
                'expires_at' => now()->addHour()->toIso8601String(),
            ]),
        ]);
    }

    protected function fakeKhaltiLookup(string $status = 'Completed', int $amountPaisa = 100000): void
    {
        Http::fake([
            'dev.khalti.com/api/v2/epayment/lookup/*' => Http::response([
                'pidx' => 'PIDX-TEST-123',
                'status' => $status,
                'transaction_id' => 'KH-TRAN-'.now()->timestamp,
                'total_amount' => $amountPaisa,
            ]),
        ]);
    }

    public function test_khalti_order_starts_in_payment_pending(): void
    {
        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'khalti');

        $this->fakeKhaltiInitiate();
        $this->fakeKhaltiLookup();

        $orderId = $this->placeOrder($user, $sessionId);

        $this->actingAs($user, 'sanctum')->getJson("/api/v1/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'payment_pending')
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.payment_method', 'khalti');
    }

    public function test_khalti_payment_initiate_returns_payment_url(): void
    {
        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'khalti');
        $orderId = $this->placeOrder($user, $sessionId);

        $this->fakeKhaltiInitiate();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'khalti']);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.provider_pidx', 'PIDX-TEST-123')
            ->assertJsonPath('data.payment_url', 'https://pay.khalti.com/?pidx=PIDX-TEST-123');

        $this->assertDatabaseHas('payments', [
            'order_id' => Order::where('uuid', $orderId)->first()->id,
            'provider_pidx' => 'PIDX-TEST-123',
            'status' => 'processing',
            'amount' => 1080.00,
        ]);
    }

    public function test_khalti_callback_confirms_order_when_completed(): void
    {
        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'khalti');
        $orderId = $this->placeOrder($user, $sessionId);

        $this->fakeKhaltiInitiate();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'khalti'])
            ->assertCreated();

        $this->fakeKhaltiLookup('Completed', 108000);

        $response = $this->postJson('/api/v1/payments/khalti/callback', [
            'pidx' => 'PIDX-TEST-123',
            'status' => 'Completed',
            'transaction_id' => 'KH-TRAN-1',
            'total_amount' => 108000,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $order = Order::where('uuid', $orderId)->first();

        $this->assertEquals('confirmed', $order->status->value);
        $this->assertEquals('paid', $order->payment_status->value);
        $this->assertNotNull($order->confirmed_at);

        $this->assertDatabaseHas('payment_status_history', [
            'payment_id' => Payment::where('provider_pidx', 'PIDX-TEST-123')->first()->id,
            'to_status' => 'paid',
        ]);
    }

    public function test_khalti_callback_rejects_amount_mismatch(): void
    {
        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'khalti');
        $orderId = $this->placeOrder($user, $sessionId);

        $this->fakeKhaltiInitiate();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'khalti'])
            ->assertCreated();

        $this->fakeKhaltiLookup('Completed', 999);

        $response = $this->postJson('/api/v1/payments/khalti/callback', [
            'pidx' => 'PIDX-TEST-123',
            'status' => 'Completed',
            'transaction_id' => 'KH-TRAN-2',
            'total_amount' => 999,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'exception');

        $order = Order::where('uuid', $orderId)->first();
        $this->assertEquals('payment_pending', $order->status->value);
        $this->assertEquals('pending', $order->payment_status->value);
    }

    public function test_khalti_callback_marks_failed_when_provider_rejects(): void
    {
        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'khalti');
        $orderId = $this->placeOrder($user, $sessionId);

        $this->fakeKhaltiInitiate();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'khalti'])
            ->assertCreated();

        $this->fakeKhaltiLookup('User canceled', 0);

        $this->postJson('/api/v1/payments/khalti/callback', [
            'pidx' => 'PIDX-TEST-123',
            'status' => 'User canceled',
        ])->assertOk()->assertJsonPath('data.status', 'failed');

        $order = Order::where('uuid', $orderId)->first();
        $this->assertEquals('payment_pending', $order->status->value);
    }

    public function test_cannot_initiate_payment_for_another_users_order(): void
    {
        [, , $product] = $this->vendorWithProduct();
        $owner = $this->customer();
        [$address, $sessionId] = $this->checkout($owner, $product, 'khalti');
        $orderId = $this->placeOrder($owner, $sessionId);

        $this->fakeKhaltiInitiate();

        $intruder = $this->customer();

        $this->actingAs($intruder, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'khalti'])
            ->assertStatus(404);
    }

    public function test_guest_cannot_access_payment_endpoints(): void
    {
        $this->getJson('/api/v1/payments/some-uuid')->assertUnauthorized();
        $this->getJson('/api/v1/payments/some-uuid/status')->assertUnauthorized();
        $this->postJson('/api/v1/payments/initiate', [])->assertUnauthorized();
    }

    public function test_khalti_disabled_rejects_checkout(): void
    {
        Setting::set('payment.khalti_enabled', 'false', 'payment', 'boolean');

        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();

        $address = CustomerAddress::query()->create([
            'user_id' => $user->id,
            'address_type' => 'shipping',
            'label' => 'Home',
            'full_name' => 'Payment Customer',
            'phone' => '9812345678',
            'address_line_1' => 'Baluwatar',
            'postal_code' => '44600',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/cart/items', ['product_id' => $product->uuid, 'quantity' => 1])
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/checkout/', ['shipping_address_id' => $address->uuid, 'payment_method' => 'khalti'])
            ->assertStatus(422);
    }

    public function test_payment_status_endpoint_shows_order(): void
    {
        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'khalti');
        $orderId = $this->placeOrder($user, $sessionId);

        $this->fakeKhaltiInitiate();
        $payment = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'khalti'])
            ->json('data.id');

        $this->actingAs($user, 'sanctum')->getJson("/api/v1/payments/{$payment}/status")
            ->assertOk()
            ->assertJsonPath('data.payment.status', 'processing')
            ->assertJsonPath('data.order.id', $orderId);
    }
}
