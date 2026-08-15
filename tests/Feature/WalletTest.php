<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PayoutStatus;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\SettlementStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletTest extends TestCase
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

    protected function vendorUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        return $user;
    }

    protected function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::SUPER_ADMIN);

        return $user;
    }

    protected function approvedVendor(User $user): Vendor
    {
        return Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Wallet Vendor',
            'business_email' => 'wallet@vendor.com.np',
            'status' => VendorStatus::APPROVED,
            'commission_rate' => 10,
        ]);
    }

    protected function productFor(Vendor $vendor, string $suffix): Product
    {
        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Wallet Store '.$suffix,
            'slug' => 'wallet-store-'.$suffix,
            'contact_email' => 'wallet@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        return Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Wallet Product '.$suffix,
            'slug' => 'wallet-product-'.$suffix,
            'sku' => 'WL-'.$suffix,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 20,
            'low_stock_threshold' => 2,
            'price' => 1000.00,
            'tax_rate' => 0,
        ]);
    }

    protected function deliveredVendorOrder(Vendor $vendor, Product $product): array
    {
        $customer = $this->customer();

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-WL-'.$product->id,
            'payment_method' => 'cod',
            'payment_status' => OrderPaymentStatus::PAID->value,
            'status' => OrderStatus::DELIVERED->value,
            'subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'currency' => 'NPR',
            'placed_at' => now()->subDays(12),
            'completed_at' => now()->subDays(10),
        ]);

        $vendorOrder = VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'store_id' => $product->store_id,
            'vendor_order_number' => 'VO-WL-'.$order->id,
            'status' => OrderStatus::DELIVERED->value,
            'delivery_status' => 'delivered',
            'items_subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'commission_rate' => 10,
            'commission_amount' => 108.00,
            'vendor_payable' => 972.00,
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

        app(\App\Modules\Wallet\Application\Services\WalletService::class)->recordCommission($vendorOrder);

        return [$order, $vendorOrder];
    }

    public function test_commission_recorded_when_order_placed(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'A');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $this->assertDatabaseHas('commissions', [
            'vendor_order_id' => $order[1]->id,
            'order_id' => $order[0]->id,
            'vendor_id' => $vendor->id,
            'status' => 'calculated',
            'amount' => 108.00,
        ]);
    }

    public function test_earnings_credited_after_delivery_and_return_window(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'B');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $wallet = app(\App\Modules\Wallet\Application\Services\WalletService::class)->creditEarnings($order[1]);

        $this->assertSame('earned', $wallet->status->value);
        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'balance' => 972.00,
            'pending_balance' => 972.00,
            'available_balance' => 0.00,
        ]);
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $this->walletId($vendor),
            'transaction_type' => 'credit_earnings',
            'amount' => 972.00,
        ]);
    }

    public function test_earnings_not_credited_before_return_window_elapses(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'C');
        $customer = $this->customer();

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-WL-C-'.$product->id,
            'payment_method' => 'cod',
            'payment_status' => OrderPaymentStatus::PAID->value,
            'status' => OrderStatus::DELIVERED->value,
            'subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'currency' => 'NPR',
            'placed_at' => now()->subDay(),
            'completed_at' => now(),
        ]);

        $vendorOrder = VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'store_id' => $product->store_id,
            'vendor_order_number' => 'VO-WL-C-'.$order->id,
            'status' => OrderStatus::DELIVERED->value,
            'delivery_status' => 'delivered',
            'items_subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'commission_rate' => 10,
            'commission_amount' => 108.00,
            'vendor_payable' => 972.00,
        ]);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);

        $this->expectException(\App\Modules\Shared\Domain\Exceptions\DomainException::class);
        $service->creditEarnings($vendorOrder);
    }

    public function test_settlement_generated_moves_pending_to_available(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'D');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor(
            $vendor,
            now()->subDays(30)->startOfDay(),
            now()
        );

        $this->assertSame(SettlementStatus::PENDING->value, $settlement->status->value);
        $this->assertSame(972.00, (float) $settlement->net_payable);
        $this->assertSame(108.00, (float) $settlement->commission_total);

        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'balance' => 972.00,
            'pending_balance' => 0.00,
            'available_balance' => 972.00,
        ]);
        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $this->walletId($vendor),
            'transaction_type' => 'credit_settlement',
            'amount' => 972.00,
        ]);
    }

    public function test_settlement_excludes_already_settled_orders(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'E');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now());

        $this->expectException(\App\Modules\Shared\Domain\Exceptions\DomainException::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now());
    }

    public function test_payout_request_requires_available_balance(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'F');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now());
        $vendorUser = $vendor->user;

        $payout = $service->requestPayout($vendor, 500.00, null, $vendorUser);

        $this->assertSame(PayoutStatus::PENDING->value, $payout->status->value);
        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'balance' => 472.00,
            'available_balance' => 472.00,
        ]);

        $this->expectException(\App\Modules\Shared\Domain\Exceptions\DomainException::class);
        $service->requestPayout($vendor, 5000.00, null, $vendorUser);
    }

    public function test_payout_full_flow_approve_paid(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'G');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $bank = BankAccount::query()->create([
            'vendor_id' => $vendor->id,
            'bank_name' => 'NMB Bank',
            'branch_name' => 'Main',
            'account_name' => 'Wallet Vendor',
            'account_number' => '1234567890',
            'account_type' => 'savings',
            'is_verified' => true,
        ]);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now());

        $admin = $this->admin();
        $vendorUser = $vendor->user;

        $payout = $service->requestPayout($vendor, 972.00, $bank->id, $vendorUser);
        $payout->update(['settlement_id' => $settlement->id]);

        $payout = $service->approvePayout($payout, $admin);
        $this->assertSame(PayoutStatus::APPROVED->value, $payout->status->value);
        $this->assertDatabaseHas('settlements', ['id' => $settlement->id, 'status' => SettlementStatus::PROCESSING->value]);

        $payout = $service->markPayoutPaid($payout, $admin, 'NMB-REF-001', 20.00);
        $this->assertSame(PayoutStatus::PAID->value, $payout->status->value);
        $this->assertDatabaseHas('settlements', ['id' => $settlement->id, 'status' => SettlementStatus::PAID->value]);
        $this->assertDatabaseHas('payout_records', [
            'payout_request_id' => $payout->id,
            'provider_reference' => 'NMB-REF-001',
            'amount' => 972.00,
            'fee' => 20.00,
            'net_amount' => 952.00,
            'status' => 'paid',
        ]);
    }

    public function test_payout_rejection_returns_funds(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'H');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now());
        $admin = $this->admin();

        $payout = $service->requestPayout($vendor, 400.00, null, $vendor->user);
        $payout = $service->rejectPayout($payout, $admin, 'Bank details mismatch');

        $this->assertSame(PayoutStatus::REJECTED->value, $payout->status->value);
        $this->assertSame('Bank details mismatch', $payout->rejection_reason);
        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'balance' => 972.00,
            'available_balance' => 972.00,
        ]);
    }

    public function test_vendor_can_view_wallet_and_payouts(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'I');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now());

        $token = $vendor->user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/vendor/wallet/')
            ->assertOk()
            ->assertJsonPath('data.available_balance', '972.00')
            ->assertJsonPath('data.pending_balance', '0.00');

        $this->withToken($token)
            ->getJson('/api/v1/vendor/wallet/transactions')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->withToken($token)
            ->postJson('/api/v1/vendor/wallet/payouts', ['amount' => 100, 'bank_account_id' => null])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_customer_cannot_access_vendor_wallet(): void
    {
        $token = $this->customer()->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/vendor/wallet/')
            ->assertForbidden();
    }

    public function test_guest_cannot_access_wallet(): void
    {
        $this->getJson('/api/v1/vendor/wallet/')->assertUnauthorized();
    }

    public function test_admin_can_generate_settlement_and_adjust_balance(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'J');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $token = $this->admin()->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/admin/wallet/settlements/generate', [
                'vendor_id' => $vendor->uuid,
                'period_start' => now()->subDays(30)->toDateString(),
                'period_end' => now()->toDateString(),
            ])
            ->assertCreated()
            ->assertJsonPath('data.net_payable', '972.00');

        $this->withToken($token)
            ->postJson('/api/v1/admin/wallet/vendors/'.$vendor->uuid.'/wallet/adjust', [
                'amount' => 50,
                'reason' => 'Manual bonus',
            ])
            ->assertOk()
            ->assertJsonPath('data.available_balance', '1022.00');
    }

    public function test_vendor_admin_cannot_approve_payouts(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'K');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now());
        $payout = $service->requestPayout($vendor, 100, null, $vendor->user);

        $this->withToken($vendor->user->createToken('test')->plainTextToken)
            ->postJson('/api/v1/admin/wallet/payouts/'.$payout->uuid.'/approve')
            ->assertForbidden();
    }

    protected function walletId(Vendor $vendor): int
    {
        return \App\Modules\Wallet\Infrastructure\Models\VendorWallet::query()
            ->where('vendor_id', $vendor->id)
            ->firstOrFail()->id;
    }
}
