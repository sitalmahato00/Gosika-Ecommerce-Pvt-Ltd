<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Wallet\Infrastructure\Models\PayoutRequest;
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

    protected function deliveredVendorOrder(Vendor $vendor, Product $product, int $completedDaysAgo = 10): array
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
            'placed_at' => now()->subDays($completedDaysAgo + 2),
            'completed_at' => now()->subDays($completedDaysAgo),
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

    public function test_settlement_generated_is_eligible_and_holds_funds_pending(): void
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

        $this->assertSame(SettlementStatus::ELIGIBLE->value, $settlement->status->value);
        $this->assertSame(972.00, (float) $settlement->net_payable);
        $this->assertSame(108.00, (float) $settlement->commission_total);

        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'balance' => 972.00,
            'pending_balance' => 972.00,
            'available_balance' => 0.00,
        ]);
    }

    public function test_settlement_hold_and_release_keeps_funds_pending(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'R');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $held = $service->holdSettlement($settlement, $this->admin(), 'Statement dispute');

        $this->assertSame(SettlementStatus::HOLD->value, $held->status->value);
        $this->assertSame('Statement dispute', $held->hold_reason);
        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'balance' => 972.00,
            'pending_balance' => 972.00,
            'available_balance' => 0.00,
        ]);

        $released = $service->releaseSettlement($settlement, $this->admin());

        $this->assertSame(SettlementStatus::ELIGIBLE->value, $released->status->value);
        $this->assertNull($released->hold_reason);
    }

    public function test_settlement_excludes_already_settled_orders(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'E');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $this->expectException(\App\Modules\Shared\Domain\Exceptions\DomainException::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());
    }

    public function test_payout_request_requires_eligible_completed_cycle_settlement(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'F');
        $order = $this->deliveredVendorOrder($vendor, $product, 40);
        $product2 = $this->productFor($vendor, 'F2');
        $order2 = $this->deliveredVendorOrder($vendor, $product2, 10);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(50)->startOfDay(), now()->subDays(30));
        $future = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());
        $future->update(['period_end' => now()->addDays(7)->toDateString()]);

        $vendorUser = $vendor->user;

        $payout = $service->requestPayout($settlement, null, $vendorUser);

        $this->assertSame(PayoutStatus::PENDING->value, $payout->status->value);
        $this->assertSame(972.00, (float) $payout->amount);
        $this->assertSame($settlement->id, $payout->settlement_id);
        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'balance' => 972.00,
            'pending_balance' => 972.00,
        ]);

        try {
            $service->requestPayout($settlement, null, $vendorUser);
            $this->fail('A second payout request for the same settlement should be rejected.');
        } catch (\App\Modules\Shared\Domain\Exceptions\DomainException $e) {
            $this->assertStringContainsString('Only eligible settlements', $e->getMessage());
        }

        try {
            $service->requestPayout($future, null, $vendorUser);
            $this->fail('A settlement with an unfinished cycle should not be requestable.');
        } catch (\App\Modules\Shared\Domain\Exceptions\DomainException $e) {
            $this->assertStringContainsString('Only eligible settlements', $e->getMessage());
        }
    }

    public function test_payout_full_flow_approve_and_paid(): void
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
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $admin = $this->admin();
        $vendorUser = $vendor->user;

        $payout = $service->requestPayout($settlement, $bank->id, $vendorUser);
        $this->assertSame(PayoutStatus::PENDING->value, $payout->status->value);

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

    public function test_payout_rejection_returns_funds_to_pending(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'H');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());
        $admin = $this->admin();

        $payout = $service->requestPayout($settlement, null, $vendor->user);
        $payout = $service->rejectPayout($payout, $admin, 'Bank details mismatch');

        $this->assertSame(PayoutStatus::REJECTED->value, $payout->status->value);
        $this->assertSame('Bank details mismatch', $payout->rejection_reason);
        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'balance' => 972.00,
            'pending_balance' => 972.00,
            'available_balance' => 0.00,
        ]);
        $this->assertDatabaseHas('settlements', ['id' => $settlement->id, 'status' => SettlementStatus::ELIGIBLE->value]);
    }

    public function test_vendor_can_view_wallet_and_payouts(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'I');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $token = $vendor->user->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/vendor/wallet/')
            ->assertOk()
            ->assertJsonPath('data.available_balance', '0.00')
            ->assertJsonPath('data.pending_balance', '972.00');

        $this->withToken($token)
            ->getJson('/api/v1/vendor/wallet/transactions')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->withToken($token)
            ->postJson('/api/v1/vendor/wallet/payouts', ['settlement_id' => $settlement->uuid, 'bank_account_id' => null])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.amount', '972.00')
            ->assertJsonPath('data.settlement_id', $settlement->uuid);
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
            ->assertJsonPath('data.available_balance', '50.00');
    }

    public function test_admin_can_hold_and_release_settlement_via_api(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'L');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());
        $token = $this->admin()->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/v1/admin/wallet/settlements/'.$settlement->uuid.'/hold', ['reason' => 'Audit review'])
            ->assertOk()
            ->assertJsonPath('data.status', 'hold')
            ->assertJsonPath('data.hold_reason', 'Audit review');

        $this->withToken($token)
            ->postJson('/api/v1/admin/wallet/settlements/'.$settlement->uuid.'/release')
            ->assertOk()
            ->assertJsonPath('data.status', 'eligible');

        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'pending_balance' => 972.00,
            'available_balance' => 0.00,
        ]);
    }

    public function test_grouped_settlements_net_payable_excludes_paid_and_ledger_shows_periods(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'M');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $product2 = $this->productFor($vendor, 'M2');
        $order2 = $this->deliveredVendorOrder($vendor, $product2, 9);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);

        $first = $service->settleVendor($vendor, $order[1]->order->completed_at->copy()->subDay()->startOfDay(), $order2[1]->order->completed_at->copy()->subSecond());
        $second = $service->settleVendor($vendor, $order2[1]->order->completed_at->copy()->subDay()->startOfDay(), now());

        $bank = BankAccount::query()->create([
            'vendor_id' => $vendor->id,
            'bank_name' => 'NMB Bank',
            'branch_name' => 'Main',
            'account_name' => 'Wallet Vendor',
            'account_number' => '4455667788',
            'account_type' => 'savings',
            'is_verified' => true,
        ]);

        $admin = $this->admin();
        $paidPayout = $service->requestPayout($first, $bank->id, $vendor->user);
        $paidPayout = $service->approvePayout($paidPayout, $admin);
        $service->markPayoutPaid($paidPayout, $admin, 'NMB-REF-M001', 0.00);

        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/admin/wallet/settlements?group_by_vendor=1')
            ->assertOk()
            ->assertJsonPath('data.0.vendor_name', 'Wallet Vendor')
            ->assertJsonPath('data.0.status', 'eligible')
            ->assertJsonPath('data.0.net_payable', '972.00')
            ->assertJsonPath('data.0.settled_amount', '972.00');

        $ledger = $this->withToken($token)
            ->getJson('/api/v1/admin/wallet/vendors/'.$vendor->uuid.'/ledger')
            ->assertOk();

        $orders = collect($ledger->json('data.orders'))->keyBy('vendor_order_number');
        $this->assertNotNull($orders->get('VO-WL-'.$order[1]->id)['settlement']['number']);
        $this->assertSame('paid', $orders->get('VO-WL-'.$order[1]->id)['settlement']['status']);
        $this->assertSame('eligible', $orders->get('VO-WL-'.$order2[1]->id)['settlement']['status']);
        $this->assertSame('108.00', $orders->get('VO-WL-'.$order[1]->id)['items'][0]['line_commission']);
        $this->assertSame('892.00', $orders->get('VO-WL-'.$order[1]->id)['items'][0]['line_vendor_payable']);
    }

    public function test_approve_payout_by_uuid_resolves_correct_request_only(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'N');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $bank = BankAccount::query()->create([
            'vendor_id' => $vendor->id,
            'bank_name' => 'NMB Bank',
            'branch_name' => 'Main',
            'account_name' => 'Wallet Vendor',
            'account_number' => '0987654321',
            'account_type' => 'savings',
            'is_verified' => true,
        ]);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $distractor = PayoutRequest::query()->create([
            'payout_number' => 'POUT-DIST-01',
            'vendor_id' => $vendor->id,
            'settlement_id' => $settlement->id,
            'wallet_id' => $this->walletId($vendor),
            'bank_account_id' => $bank->id,
            'amount' => 1.00,
            'status' => PayoutStatus::PAID,
            'requested_at' => now(),
        ]);

        $target = $service->requestPayout($settlement, $bank->id, $vendor->user);

        // Give the target a uuid whose leading digits equal the distractor's id,
        // which used to make `orWhere('id', $uuid)` resolve the WRONG row.
        $target->uuid = $distractor->id.'abc-def00-0000-0000-000000000000';
        $target->save();
        $target->refresh();

        $this->withToken($this->admin()->createToken('test')->plainTextToken)
            ->postJson('/api/v1/admin/wallet/payouts/'.$target->uuid.'/approve')
            ->assertOk()
            ->assertJsonPath('data.id', $target->uuid)
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('payout_requests', ['id' => $target->id, 'status' => 'approved']);
        $this->assertDatabaseHas('payout_requests', ['id' => $distractor->id, 'status' => 'paid']);
    }

    public function test_approving_payout_promotes_eligible_settlement_to_processing(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'O');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $bank = BankAccount::query()->create([
            'vendor_id' => $vendor->id,
            'bank_name' => 'NMB Bank',
            'branch_name' => 'Main',
            'account_name' => 'Wallet Vendor',
            'account_number' => '1122334455',
            'account_type' => 'savings',
            'is_verified' => true,
        ]);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $this->assertDatabaseHas('settlements', ['id' => $settlement->id, 'status' => 'eligible']);

        $payout = $service->requestPayout($settlement, $bank->id, $vendor->user);

        $service->approvePayout($payout, $this->admin());

        $this->assertDatabaseHas('settlements', ['id' => $settlement->id, 'status' => 'processing', 'hold_reason' => null]);
        $this->assertDatabaseHas('payout_requests', ['id' => $payout->id, 'status' => 'approved']);
    }

    public function test_vendor_admin_cannot_approve_payouts(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'K');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());
        $payout = $service->requestPayout($settlement, null, $vendor->user);

        $this->withToken($vendor->user->createToken('test')->plainTextToken)
            ->postJson('/api/v1/admin/wallet/payouts/'.$payout->uuid.'/approve')
            ->assertForbidden();
    }

    public function test_eligible_settlement_can_be_distributed_directly_to_available(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'P');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $distributed = $service->distributeSettlement($settlement, $this->admin());

        $this->assertSame(SettlementStatus::PAID->value, $distributed->status->value);
        $this->assertNotNull($distributed->paid_at);
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

    public function test_processing_settlement_distribute_marks_accepted_payout_paid(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'Q');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $bank = BankAccount::query()->create([
            'vendor_id' => $vendor->id,
            'bank_name' => 'NMB Bank',
            'branch_name' => 'Main',
            'account_name' => 'Wallet Vendor',
            'account_number' => '5566778899',
            'account_type' => 'savings',
            'is_verified' => true,
        ]);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $payout = $service->requestPayout($settlement, $bank->id, $vendor->user);
        $payout = $service->approvePayout($payout, $this->admin());

        $this->assertDatabaseHas('settlements', ['id' => $settlement->id, 'status' => SettlementStatus::PROCESSING->value]);

        $service->distributeSettlement($settlement, $this->admin());

        $this->assertDatabaseHas('settlements', ['id' => $settlement->id, 'status' => SettlementStatus::PAID->value]);
        $this->assertDatabaseHas('payout_requests', ['id' => $payout->id, 'status' => PayoutStatus::PAID->value]);
        $this->assertDatabaseHas('payout_records', [
            'payout_request_id' => $payout->id,
            'amount' => 972.00,
            'fee' => 0.00,
            'net_amount' => 972.00,
            'status' => 'paid',
        ]);
        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'pending_balance' => 0.00,
            'available_balance' => 0.00,
        ]);
    }

    public function test_eligible_settlement_with_pending_payout_cannot_be_distributed(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'S');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $service->requestPayout($settlement, null, $vendor->user);

        $this->expectException(\App\Modules\Shared\Domain\Exceptions\DomainException::class);
        $service->distributeSettlement($settlement, $this->admin());
    }

    public function test_admin_can_distribute_settlement_via_api(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'T');
        $order = $this->deliveredVendorOrder($vendor, $product);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $settlement = $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $this->withToken($this->admin()->createToken('test')->plainTextToken)
            ->postJson('/api/v1/admin/wallet/settlements/'.$settlement->uuid.'/distribute')
            ->assertOk()
            ->assertJsonPath('data.status', 'paid');

        $this->assertDatabaseHas('vendor_wallets', [
            'vendor_id' => $vendor->id,
            'pending_balance' => 0.00,
            'available_balance' => 972.00,
        ]);
    }

    public function test_ledger_includes_pagination_meta_and_bank_accounts(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'U');
        $order = $this->deliveredVendorOrder($vendor, $product);

        BankAccount::query()->create([
            'vendor_id' => $vendor->id,
            'bank_name' => 'NMB Bank',
            'branch_name' => 'Main',
            'account_name' => 'Wallet Vendor',
            'account_number' => '9988776655',
            'account_type' => 'savings',
            'is_verified' => true,
            'is_default' => true,
        ]);

        $service = app(\App\Modules\Wallet\Application\Services\WalletService::class);
        $service->settleVendor($vendor, now()->subDays(30)->startOfDay(), now()->subDay());

        $ledger = $this->withToken($this->admin()->createToken('test')->plainTextToken)
            ->getJson('/api/v1/admin/wallet/vendors/'.$vendor->uuid.'/ledger')
            ->assertOk();

        $data = $ledger->json('data');
        $this->assertGreaterThanOrEqual(1, $data['orders_pagination']['total']);
        $this->assertGreaterThanOrEqual(1, $data['settlements_pagination']['total']);
        $this->assertArrayHasKey('transactions_pagination', $data);
        $this->assertArrayHasKey('payouts_pagination', $data);
        $this->assertSame('NMB Bank', $data['bank_accounts'][0]['bank_name']);
        $this->assertSame('9988776655', $data['bank_accounts'][0]['account_number']);
        $this->assertTrue($data['bank_accounts'][0]['is_default']);
        $this->assertSame(14, $data['vendor']['settlement_cycle_days']);
    }

    public function test_admin_can_update_vendor_settlement_cycle_days(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());

        $this->withToken($this->admin()->createToken('test')->plainTextToken)
            ->putJson('/api/v1/admin/wallet/vendors/'.$vendor->uuid.'/settlement-cycle', [
                'settlement_cycle_days' => 7,
            ])
            ->assertOk()
            ->assertJsonPath('data.settlement_cycle_days', 7);

        $this->assertSame(7, (int) $vendor->fresh()->meta['settlement_cycle_days']);

        $this->withToken($this->admin()->createToken('test')->plainTextToken)
            ->putJson('/api/v1/admin/wallet/vendors/'.$vendor->uuid.'/settlement-cycle', [
                'settlement_cycle_days' => 0,
            ])
            ->assertUnprocessable();
    }

    protected function walletId(Vendor $vendor): int
    {
        return \App\Modules\Wallet\Infrastructure\Models\VendorWallet::query()
            ->where('vendor_id', $vendor->id)
            ->firstOrFail()->id;
    }
}
