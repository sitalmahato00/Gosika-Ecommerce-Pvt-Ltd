<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\DeliveryPartnerStatus;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryTest extends TestCase
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

    protected function partnerUser(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::CUSTOMER);

        return $user;
    }

        protected function approvedVendor(User $user, string $suffix = ''): Vendor
        {
            $user->assignRole(Roles::VENDOR_ADMIN);

            return Vendor::query()->create([
                'user_id' => $user->id,
                'company_name' => 'Delivery Vendor '.$suffix,
                'business_email' => 'delivery'.$suffix.'@vendor.com.np',
                'status' => VendorStatus::APPROVED,
                'commission_rate' => 10,
            ]);
        }

    protected function productFor(Vendor $vendor, string $suffix, int $quantity = 10): Product
    {
        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Delivery Store '.$suffix,
            'slug' => 'delivery-store-'.$suffix,
            'contact_email' => 'delivery'.$suffix.'@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        return Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Delivery Product '.$suffix,
            'slug' => 'delivery-product-'.$suffix,
            'sku' => 'DL-'.$suffix,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => $quantity,
            'low_stock_threshold' => 2,
            'price' => 500.00,
            'tax_rate' => 0,
        ]);
    }

    protected function approvedPartner(User $user, string $suffix = ''): DeliveryPartner
    {
        return DeliveryPartner::query()->create([
            'user_id' => $user->id,
            'name' => 'Partner '.$suffix,
            'phone' => fake()->unique()->numerify('98########'),
            'email' => 'partner'.$suffix.'@delivery.com.np',
            'vehicle_type' => 'motorbike',
            'vehicle_number' => 'Ba '.$suffix,
            'service_areas' => ['Biratnagar', 'Dharan'],
            'status' => DeliveryPartnerStatus::APPROVED,
            'is_online' => true,
        ]);
    }

    protected function pendingVendorOrder(Vendor $vendor, Product $product): array
    {
        $customer = $this->customer();

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-DL-'.$product->id,
            'payment_method' => 'cod',
            'payment_status' => OrderPaymentStatus::PENDING->value,
            'status' => OrderStatus::PENDING->value,
            'subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'currency' => 'NPR',
            'shipping_address_snapshot' => json_encode([
                'full_name' => 'Recipient One',
                'phone' => '9801111111',
                'address_line_1' => 'Main Road',
                'district' => 'Morang',
                'province' => 'Province 1',
            ]),
            'placed_at' => now(),
        ]);

        $vendorOrder = VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'store_id' => $product->store_id,
            'vendor_order_number' => 'VO-DL-'.$order->id,
            'status' => OrderStatus::PENDING->value,
            'delivery_status' => 'pending',
            'items_subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'commission_rate' => 10,
            'commission_amount' => 58.00,
            'vendor_payable' => 522.00,
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

        $product->decrement('quantity', 1);

        return [$order, $vendorOrder];
    }

    protected function acceptedVendorOrder(Vendor $vendor, Product $product): array
    {
        [$order, $vendorOrder] = $this->pendingVendorOrder($vendor, $product);

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson('/api/v1/vendor/orders/'.$vendorOrder->uuid.'/accept')
            ->assertOk();

        $vendorOrder->refresh();

        return [$order, $vendorOrder];
    }

    protected function assignedDelivery(Vendor $vendor, Product $product, DeliveryPartner $partner): array
    {
        [$order, $vendorOrder] = $this->acceptedVendorOrder($vendor, $product);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $vendorOrder->uuid,
                'delivery_partner_id' => $partner->uuid,
            ])
            ->assertCreated();

        return [$order, $vendorOrder, DeliveryAssignment::where('uuid', $response->json('data.id'))->firstOrFail()];
    }

    public function test_admin_can_auto_assign_delivery_based_on_order_zone_and_partner_coverage(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'Z');
        [$order, $vendorOrder] = $this->pendingVendorOrder($vendor, $product);
        $partner = $this->approvedPartner($this->partnerUser(), 'Z');
        $partner->update(['service_areas' => ['Province 1']]);

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson('/api/v1/vendor/orders/'.$vendorOrder->uuid.'/accept')
            ->assertOk();

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson('/api/v1/vendor/orders/'.$vendorOrder->uuid.'/ready-for-pickup')
            ->assertOk();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/shipping/zones', [
                'name' => 'Eastern Hubs',
                'provinces' => ['Province 1'],
                'standard_charge' => 180,
                'express_charge' => 260,
                'estimated_days' => 2,
                'is_active' => true,
            ])->assertCreated();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $vendorOrder->uuid,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('delivery_assignments', [
            'vendor_order_id' => $vendorOrder->id,
            'delivery_partner_id' => $partner->id,
        ]);
    }

    public function test_delivery_partner_can_apply(): void
    {
        $this->actingAs($this->partnerUser(), 'sanctum')
            ->postJson('/api/v1/delivery-partner/apply', [
                'name' => 'Hari Bahadur',
                'phone' => '9801234567',
                'vehicle_type' => 'scooter',
                'vehicle_number' => 'Ko 4 Pa 1234',
                'service_areas' => ['Biratnagar'],
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('delivery_partners', [
            'name' => 'Hari Bahadur',
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_create_delivery_user_account_with_zone_assignment(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/delivery-partners', [
                'name' => 'Sita Rai',
                'email' => 'sita.rider@gosika.com.np',
                'phone' => '9807654321',
                'vehicle_type' => 'motorcycle',
                'vehicle_number' => 'BA 4 KHA 1234',
                'service_areas' => ['Bagmati', 'Gandaki'],
                'password' => 'Password@123',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Sita Rai')
            ->assertJsonPath('data.service_areas.0', 'Bagmati');

        $this->assertDatabaseHas('users', [
            'email' => 'sita.rider@gosika.com.np',
        ]);

        $partner = DeliveryPartner::query()->where('name', 'Sita Rai')->firstOrFail();

        $this->assertSame(['Bagmati', 'Gandaki'], $partner->service_areas);
    }

    public function test_admin_can_approve_delivery_partner(): void
    {
        $user = $this->partnerUser();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/apply', [
                'name' => 'Sita Rai',
                'phone' => '9807654321',
            ])
            ->assertCreated();

        $partner = $user->deliveryPartner;

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/delivery-partners/'.$partner->uuid.'/approve')
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertTrue($user->fresh()->hasRole(Roles::DELIVERY_PARTNER));
    }

    public function test_vendor_accept_reject_and_ready_for_pickup(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'A');
        [$order, $vendorOrder] = $this->pendingVendorOrder($vendor, $product);

        $vendorToken = $vendor->user;

        $this->actingAs($vendorToken, 'sanctum')
            ->postJson('/api/v1/vendor/orders/'.$vendorOrder->uuid.'/accept')
            ->assertOk()
            ->assertJsonPath('data.status', 'accepted');

        $this->actingAs($vendorToken, 'sanctum')
            ->postJson('/api/v1/vendor/orders/'.$vendorOrder->uuid.'/ready-for-pickup')
            ->assertOk()
            ->assertJsonPath('data.status', 'ready_for_pickup');

        $vendorOrder2 = VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'store_id' => $product->store_id,
            'vendor_order_number' => 'VO-DL-R-'.$order->id,
            'status' => OrderStatus::PENDING->value,
            'delivery_status' => 'pending',
            'items_subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'commission_rate' => 10,
        ]);

        $this->actingAs($vendorToken, 'sanctum')
            ->postJson('/api/v1/vendor/orders/'.$vendorOrder2->uuid.'/reject', ['reason' => 'Out of stock'])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');
    }

    public function test_admin_assigns_delivery_partner_to_vendor_order(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'B');
        $partner = $this->approvedPartner($this->partnerUser(), 'B');

        $vendorOrder = $this->pendingVendorOrder($vendor, $product)[1];

        $this->actingAs($vendor->user, 'sanctum')
            ->postJson('/api/v1/vendor/orders/'.$vendorOrder->uuid.'/accept')
            ->assertOk();

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $vendorOrder->uuid,
                'delivery_partner_id' => $partner->uuid,
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'assigned')
            ->assertJsonPath('data.delivery_partner_name', 'Partner B');

        $this->assertDatabaseHas('delivery_assignments', [
            'vendor_order_id' => $vendorOrder->id,
            'delivery_partner_id' => $partner->id,
            'status' => 'assigned',
            'cod_amount' => 580.00,
        ]);
    }

    public function test_partner_full_delivery_flow_with_otp(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'C');
        $partner = $this->approvedPartner($this->partnerUser(), 'C');

        [$order, $vendorOrder, $assignment] = $this->assignedDelivery($vendor, $product, $partner);

        $this->assertSame('580.00', (string) $assignment->cod_amount);

        $this->actingAs($partner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/accept')
            ->assertOk()
            ->assertJsonPath('data.status', 'accepted');

        $this->actingAs($partner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/pickup')
            ->assertOk()
            ->assertJsonPath('data.status', 'picked_up');

        $response = $this->actingAs($partner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/out-for-delivery')
            ->assertOk()
            ->assertJsonPath('data.status', 'out_for_delivery');

        $otp = $response->json('meta.otp');

        $this->actingAs($partner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/deliver', ['otp' => $otp])
            ->assertOk()
            ->assertJsonPath('data.status', 'delivered');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => OrderStatus::DELIVERED->value,
            'payment_status' => OrderPaymentStatus::PAID->value,
        ]);

        $this->assertDatabaseHas('vendor_orders', [
            'id' => $vendorOrder->id,
            'status' => OrderStatus::DELIVERED->value,
            'delivery_status' => 'delivered',
        ]);

        $this->assertDatabaseHas('delivery_tracking', [
            'assignment_id' => $assignment->id,
            'status' => 'delivered',
        ]);
        $this->assertDatabaseCount('delivery_tracking', 5);
    }

    public function test_delivery_rejects_invalid_otp(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'D');
        $partner = $this->approvedPartner($this->partnerUser(), 'D');

        [, , $assignment] = $this->assignedDelivery($vendor, $product, $partner);

        $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/accept')->assertOk();
        $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/pickup')->assertOk();
        $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/out-for-delivery')->assertOk();

        $this->actingAs($partner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/deliver', ['otp' => '000000'])
            ->assertStatus(422);
    }

    public function test_failed_delivery_can_be_returned_and_stock_restored(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'E', 5);
        $partner = $this->approvedPartner($this->partnerUser(), 'E');

        [, $vendorOrder, $assignment] = $this->assignedDelivery($vendor, $product, $partner);

        $this->actingAs($partner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/accept')
            ->assertOk();

        $this->actingAs($partner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/fail', ['reason' => 'Customer unavailable'])
            ->assertOk()
            ->assertJsonPath('data.status', 'failed');

        $this->actingAs($partner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/return')
            ->assertOk()
            ->assertJsonPath('data.status', 'returned_to_vendor');

        $this->assertDatabaseHas('vendor_orders', [
            'id' => $vendorOrder->id,
            'status' => OrderStatus::RETURNED->value,
            'delivery_status' => 'returned_to_vendor',
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'quantity' => 5,
        ]);
    }

    public function test_partner_cannot_act_on_others_assignment(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'F');
        $partner = $this->approvedPartner($this->partnerUser(), 'F');
        $otherPartner = $this->approvedPartner($this->partnerUser(), 'F2');

        [, , $assignment] = $this->assignedDelivery($vendor, $product, $partner);

        $this->actingAs($otherPartner->user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/accept')
            ->assertForbidden();
    }

    public function test_customer_can_view_order_tracking(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'G');
        $partner = $this->approvedPartner($this->partnerUser(), 'G');

        [$order, , $assignment] = $this->assignedDelivery($vendor, $product, $partner);

        $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/accept')->assertOk();
        $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/pickup')->assertOk();

        $this->actingAs($order->user, 'sanctum')
            ->getJson('/api/v1/orders/'.$order->uuid.'/tracking')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_guest_cannot_access_tracking(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'H');
        [$order] = $this->pendingVendorOrder($vendor, $product);

        $this->getJson('/api/v1/orders/'.$order->uuid.'/tracking')->assertUnauthorized();
    }

    public function test_admin_can_reassign_delivery(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'I');
        $partner = $this->approvedPartner($this->partnerUser(), 'I');
        $newPartner = $this->approvedPartner($this->partnerUser(), 'I2');

        [, , $assignment] = $this->assignedDelivery($vendor, $product, $partner);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/deliveries/'.$assignment->uuid.'/reassign', [
                'delivery_partner_id' => $newPartner->uuid,
            ])
            ->assertOk()
            ->assertJsonPath('data.delivery_partner_id', $newPartner->uuid);

        $this->assertDatabaseHas('delivery_assignments', [
            'id' => $assignment->id,
            'status' => 'failed',
            'failure_reason' => 'Reassigned to another delivery partner.',
        ]);
        $this->assertDatabaseHas('delivery_assignments', [
            'delivery_partner_id' => $newPartner->id,
            'status' => 'assigned',
        ]);
    }

    public function test_vendor_admin_cannot_approve_delivery_partners(): void
    {
        $user = $this->partnerUser();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/delivery-partner/apply', ['name' => 'Ram', 'phone' => '9800000001'])
            ->assertCreated();

        $this->actingAs($this->vendorUser(), 'sanctum')
            ->postJson('/api/v1/admin/delivery-partners/'.$user->deliveryPartner->uuid.'/approve')
            ->assertForbidden();
    }

    public function test_vendor_cannot_manage_other_vendors_orders(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser(), 'J');
        $otherVendor = $this->approvedVendor($this->vendorUser(), 'J2');
        $product = $this->productFor($vendor, 'J');

        [, $vendorOrder] = $this->pendingVendorOrder($vendor, $product);

        $this->actingAs($otherVendor->user, 'sanctum')
            ->postJson('/api/v1/vendor/orders/'.$vendorOrder->uuid.'/accept')
            ->assertForbidden();
    }

    public function test_partner_history_lists_completed_deliveries(): void
    {
        $vendor = $this->approvedVendor($this->vendorUser());
        $product = $this->productFor($vendor, 'K');
        $partner = $this->approvedPartner($this->partnerUser(), 'K');

        [, , $assignment] = $this->assignedDelivery($vendor, $product, $partner);

        $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/accept')->assertOk();
        $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/pickup')->assertOk();
        $otp = $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/out-for-delivery')->json('meta.otp');
        $this->actingAs($partner->user, 'sanctum')->postJson('/api/v1/delivery-partner/assignments/'.$assignment->uuid.'/deliver', ['otp' => $otp])->assertOk();

        $this->actingAs($partner->user, 'sanctum')
            ->getJson('/api/v1/delivery-partner/history')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
