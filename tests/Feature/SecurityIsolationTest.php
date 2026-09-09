<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityIsolationTest extends TestCase
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

    protected function vendorUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        return $user;
    }

    protected function deliveryPartnerUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::DELIVERY_PARTNER);
        DeliveryPartner::query()->create([
            'user_id' => $user->id,
            'name' => 'Test Partner',
            'phone' => '9800000010',
            'email' => 'partner@security.test',
            'vehicle_type' => 'motorcycle',
            'vehicle_number' => 'BA 1 PA 1111',
            'service_areas' => ['Biratnagar'],
            'status' => 'approved',
        ]);

        return $user;
    }

    protected function superAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::SUPER_ADMIN);

        return $user;
    }

    protected function approvedVendor(User $user, string $email = 'vendor@security.test'): Vendor
    {
        return Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Security Vendor',
            'business_email' => $email,
            'status' => VendorStatus::APPROVED,
        ]);
    }

    public function test_customer_cannot_access_admin_routes(): void
    {
        $this->actingAs($this->customer(), 'sanctum')
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(403);

        $this->actingAs($this->customer(), 'sanctum')
            ->getJson('/api/v1/admin/deliveries')
            ->assertStatus(403);
    }

    public function test_customer_cannot_access_vendor_routes(): void
    {
        $this->actingAs($this->customer(), 'sanctum')
            ->getJson('/api/v1/vendor/me')
            ->assertStatus(403);

        $this->actingAs($this->customer(), 'sanctum')
            ->getJson('/api/v1/vendor/wallet/')
            ->assertStatus(403);

        $this->actingAs($this->customer(), 'sanctum')
            ->postJson('/api/v1/vendor/stores', [
                'name' => 'Hijack Store',
                'contact_email' => 'hijack@example.com',
            ])
            ->assertStatus(403);
    }

    public function test_customer_cannot_access_delivery_routes(): void
    {
        $this->actingAs($this->customer(), 'sanctum')
            ->getJson('/api/v1/delivery-partner/me')
            ->assertStatus(403);

        $this->actingAs($this->customer(), 'sanctum')
            ->getJson('/api/v1/delivery-partner/assignments')
            ->assertStatus(403);
    }

    public function test_vendor_cannot_access_admin_routes(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());

        $this->actingAs($vendor->user, 'sanctum')
            ->getJson('/api/v1/admin/deliveries')
            ->assertStatus(403);

        $this->actingAs($vendor->user, 'sanctum')
            ->getJson('/api/v1/admin/wallet/vendors/'.$vendor->uuid.'/wallet')
            ->assertStatus(403);

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson('/api/v1/admin/brand-requests/does-not-exist/approve')
            ->assertStatus(403);

        $this->actingAs($vendor->user, 'sanctum')
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(403);
    }

    public function test_vendor_cannot_access_delivery_routes(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());

        $this->actingAs($vendor->user, 'sanctum')
            ->getJson('/api/v1/delivery-partner/me')
            ->assertStatus(403);

        $this->actingAs($vendor->user, 'sanctum')
            ->getJson('/api/v1/delivery-partner/assignments')
            ->assertStatus(403);
    }

    public function test_delivery_partner_cannot_access_admin_or_vendor_routes(): void
    {
        $user = $this->deliveryPartnerUser();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(403);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendor/me')
            ->assertStatus(403);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendor/wallet/')
            ->assertStatus(403);
    }

    public function test_approved_vendor_can_access_vendor_routes(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());

        $this->actingAs($vendor->user, 'sanctum')
            ->getJson('/api/v1/vendor/me')
            ->assertOk();

        $this->actingAs($vendor->user, 'sanctum')
            ->getJson('/api/v1/vendor/wallet/')
            ->assertOk();
    }

    public function test_pending_vendor_applicant_can_continue_onboarding_but_not_operate(): void
    {
        $user = $this->customer();
        Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Pending Vendor',
            'business_email' => 'pending@security.test',
            'status' => VendorStatus::PENDING,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendor/me')
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/vendor/kyc', [
                'owner_full_name' => 'Rita Shrestha',
                'owner_citizenship_number' => 'CIT-999',
                'owner_email' => 'rita@example.com',
                'owner_phone' => '9800000099',
                'business_type' => 'retail',
                'address' => 'Biratnagar',
            ])
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendor/wallet/')
            ->assertStatus(403);
    }

    public function test_delivery_applicant_can_read_own_profile_but_not_other_portals(): void
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::CUSTOMER);
        DeliveryPartner::query()->create([
            'user_id' => $user->id,
            'name' => 'Pending Partner',
            'phone' => '9800000011',
            'email' => 'pending@delivery.test',
            'vehicle_type' => 'scooter',
            'vehicle_number' => 'KO 4 PA 2222',
            'service_areas' => ['Biratnagar'],
            'status' => 'pending',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/delivery-partner/me')
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/admin/settings')
            ->assertStatus(403);
    }

    public function test_super_admin_can_access_admin_routes(): void
    {
        $this->actingAs($this->superAdmin(), 'sanctum')
            ->getJson('/api/v1/admin/settings')
            ->assertOk();

        $this->actingAs($this->superAdmin(), 'sanctum')
            ->getJson('/api/v1/admin/deliveries')
            ->assertOk();
    }

    public function test_vendor_approval_grants_vendor_admin_role_and_rejection_removes_it(): void
    {
        $admin = $this->superAdmin();
        $user = $this->customer();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Role Vendor',
            'business_email' => 'role@security.test',
            'status' => VendorStatus::UNDER_REVIEW,
        ]);

        $this->assertFalse($user->hasRole(Roles::VENDOR_ADMIN));

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/vendors/'.$vendor->uuid.'/approve')
            ->assertOk();

        $this->assertTrue($user->fresh()->hasRole(Roles::VENDOR_ADMIN));

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/vendors/'.$vendor->uuid.'/reject', [
                'reason' => 'Invalid documents',
            ])
            ->assertOk();

        $this->assertFalse($user->fresh()->hasRole(Roles::VENDOR_ADMIN));
    }

    public function test_vendor_with_stale_admin_permission_cannot_view_other_orders_tracking(): void
    {
        $orderVendorUser = $this->vendorUser();
        $orderVendor = $this->approvedVendor($orderVendorUser);

        $attacker = $this->vendorUser();
        $this->approvedVendor($attacker, 'attacker@security.test');
        $attacker->givePermissionTo(Permissions::ORDERS_VIEW, Permissions::DELIVERIES_MANAGE);

        $store = Store::query()->create([
            'vendor_id' => $orderVendor->id,
            'name' => 'Security Store',
            'slug' => 'security-store',
            'contact_email' => 'store@security.test',
            'status' => StoreStatus::ACTIVE,
        ]);

        $product = Product::query()->create([
            'vendor_id' => $orderVendor->id,
            'store_id' => $store->id,
            'name' => 'Security Product',
            'slug' => 'security-product',
            'sku' => 'SEC-001',
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 10,
            'price' => 500.00,
        ]);

        $customer = $this->customer();

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-SEC-001',
            'payment_method' => 'cod',
            'payment_status' => OrderPaymentStatus::PENDING->value,
            'status' => OrderStatus::PENDING->value,
            'subtotal' => 500,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => 580,
            'currency' => 'NPR',
            'shipping_address_snapshot' => json_encode([
                'full_name' => 'Recipient',
                'phone' => '9801111111',
                'address_line_1' => 'Main Road',
                'district' => 'Morang',
            ]),
            'placed_at' => now(),
        ]);

        $vendorOrder = VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_id' => $orderVendor->id,
            'store_id' => $store->id,
            'vendor_order_number' => 'VO-SEC-001',
            'status' => OrderStatus::PENDING->value,
            'delivery_status' => 'pending',
            'items_subtotal' => 500,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => 580,
            'commission_rate' => 10,
            'commission_amount' => 58,
            'vendor_payable' => 522,
        ]);

        OrderItem::query()->create([
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'vendor_id' => $orderVendor->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        $this->actingAs($attacker, 'sanctum')
            ->getJson('/api/v1/orders/'.$order->uuid.'/tracking')
            ->assertStatus(403);
    }
}
