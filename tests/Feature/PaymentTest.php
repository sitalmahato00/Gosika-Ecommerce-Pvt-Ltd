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
        Setting::set('payment.khalti_secret_key', '', 'payment', 'string');
        Config::set('services.khalti.secret_key', '');

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

    protected function esewaSecret(): string
    {
        return '8gBm/:&EnhH.1/q';
    }

    protected function fakeEsewaStatus(string $status = 'COMPLETE', float $amount = 1080.0): void
    {
        Http::fake([
            'rc.esewa.com.np/api/epay/transaction/status/*' => Http::response([
                'product_code' => 'EPAYTEST',
                'transaction_uuid' => 'PAY-ESEWA',
                'total_amount' => $amount,
                'status' => $status,
                'ref_id' => $status === 'COMPLETE' ? '0001TS9' : null,
            ]),
        ]);
    }

    protected function esewaCallbackData(string $transactionUuid, string $status = 'COMPLETE', float $amount = 1080.0): array
    {
        $decoded = [
            'transaction_code' => '000AWEO',
            'status' => $status,
            'total_amount' => (string) $amount,
            'transaction_uuid' => $transactionUuid,
            'product_code' => 'EPAYTEST',
            'signed_field_names' => 'transaction_code,status,total_amount,transaction_uuid,product_code,signed_field_names',
        ];

        $parts = [];

        foreach (array_map('trim', explode(',', $decoded['signed_field_names'])) as $field) {
            $parts[] = $field.'='.$decoded[$field];
        }

        $decoded['signature'] = base64_encode(hash_hmac('sha256', implode(',', $parts), $this->esewaSecret(), true));

        return $decoded;
    }

    public function test_esewa_order_starts_in_payment_pending(): void
    {
        Setting::set('payment.esewa_enabled', 'true', 'payment', 'boolean');

        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'esewa');
        $orderId = $this->placeOrder($user, $sessionId);

        $this->actingAs($user, 'sanctum')->getJson("/api/v1/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'payment_pending')
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.payment_method', 'esewa');
    }

    public function test_esewa_payment_initiate_returns_payment_form(): void
    {
        Setting::set('payment.esewa_enabled', 'true', 'payment', 'boolean');

        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'esewa');
        $orderId = $this->placeOrder($user, $sessionId);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'esewa']);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'processing')
            ->assertJsonPath('data.payment_form.action', 'https://rc-epay.esewa.com.np/api/epay/main/v2/form');

        $fields = $response->json('data.payment_form.fields');
        $this->assertSame('1080', $fields['total_amount']);
        $this->assertSame('1080', $fields['amount']);
        $this->assertSame('0', $fields['tax_amount']);
        $this->assertSame('0', $fields['product_delivery_charge']);
        $this->assertSame('EPAYTEST', $fields['product_code']);
        $this->assertSame('total_amount,transaction_uuid,product_code', $fields['signed_field_names']);

        $expected = base64_encode(hash_hmac('sha256', 'total_amount='.$fields['total_amount'].',transaction_uuid='.$fields['transaction_uuid'].',product_code=EPAYTEST', $this->esewaSecret(), true));
        $this->assertSame($expected, $fields['signature']);

        $payment = Payment::where('uuid', $response->json('data.id'))->first();
        $this->assertSame($fields['transaction_uuid'], $payment->provider_transaction_id);
    }

    public function test_esewa_callback_confirms_order_when_complete(): void
    {
        Setting::set('payment.esewa_enabled', 'true', 'payment', 'boolean');

        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'esewa');
        $orderId = $this->placeOrder($user, $sessionId);

        $payment = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'esewa'])
            ->json('data');

        $this->fakeEsewaStatus('COMPLETE', 1080.0);
        $callback = $this->esewaCallbackData($payment['payment_form']['fields']['transaction_uuid'], 'COMPLETE', 1080.0);

        $response = $this->postJson('/api/v1/payments/esewa/callback', [
            'data' => base64_encode(json_encode($callback)),
        ]);

        $response->assertOk()->assertJsonPath('data.status', 'paid');

        $order = Order::where('uuid', $orderId)->first();
        $this->assertEquals('confirmed', $order->status->value);
        $this->assertEquals('paid', $order->payment_status->value);
        $this->assertNotNull($order->confirmed_at);
    }

    public function test_esewa_callback_rejects_amount_mismatch(): void
    {
        Setting::set('payment.esewa_enabled', 'true', 'payment', 'boolean');

        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'esewa');
        $orderId = $this->placeOrder($user, $sessionId);

        $payment = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'esewa'])
            ->json('data');

        $this->fakeEsewaStatus('COMPLETE', 500.0);
        $callback = $this->esewaCallbackData($payment['payment_form']['fields']['transaction_uuid'], 'COMPLETE', 500.0);

        $this->postJson('/api/v1/payments/esewa/callback', [
            'data' => base64_encode(json_encode($callback)),
        ])->assertStatus(422);

        $order = Order::where('uuid', $orderId)->first();
        $this->assertEquals('payment_pending', $order->status->value);
        $this->assertEquals('pending', $order->payment_status->value);
    }

    public function test_esewa_callback_pending_keeps_processing(): void
    {
        Setting::set('payment.esewa_enabled', 'true', 'payment', 'boolean');

        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'esewa');
        $orderId = $this->placeOrder($user, $sessionId);

        $payment = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'esewa'])
            ->json('data');

        $this->fakeEsewaStatus('PENDING', 1080.0);
        $callback = $this->esewaCallbackData($payment['payment_form']['fields']['transaction_uuid'], 'PENDING', 1080.0);

        $this->postJson('/api/v1/payments/esewa/callback', [
            'data' => base64_encode(json_encode($callback)),
        ])->assertOk()->assertJsonPath('data.status', 'processing');
    }

    public function test_esewa_callback_rejects_invalid_signature(): void
    {
        Setting::set('payment.esewa_enabled', 'true', 'payment', 'boolean');

        [, , $product] = $this->vendorWithProduct();
        $user = $this->customer();
        [$address, $sessionId] = $this->checkout($user, $product, 'esewa');
        $orderId = $this->placeOrder($user, $sessionId);

        $payment = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/payments/initiate', ['order_id' => $orderId, 'method' => 'esewa'])
            ->json('data');

        $callback = $this->esewaCallbackData($payment['payment_form']['fields']['transaction_uuid'], 'COMPLETE', 1080.0);
        $callback['signature'] = 'AAAAinvalid';

        $this->postJson('/api/v1/payments/esewa/callback', [
            'data' => base64_encode(json_encode($callback)),
        ])->assertStatus(422);

        $order = Order::where('uuid', $orderId)->first();
        $this->assertEquals('payment_pending', $order->status->value);
    }

    public function test_esewa_disabled_rejects_checkout(): void
    {
        Setting::set('payment.esewa_enabled', 'false', 'payment', 'boolean');
        Setting::set('payment.esewa_secret_key', '', 'payment', 'string');
        Config::set('services.esewa.secret_key', '');

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
            ->postJson('/api/v1/checkout/', ['shipping_address_id' => $address->uuid, 'payment_method' => 'esewa'])
            ->assertStatus(422);
    }
}
