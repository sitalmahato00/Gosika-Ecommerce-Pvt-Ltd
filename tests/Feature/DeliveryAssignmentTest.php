<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\DeliveryPartnerStatus;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\StoreAddress;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeliveryAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $vendorUser;
    protected Vendor $vendor;
    protected Store $store;
    protected User $riderUser1;
    protected DeliveryPartner $rider1;
    protected User $riderUser2;
    protected DeliveryPartner $rider2;

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
            'last_name' => 'Owner',
            'email' => 'vendor@gosika.com',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $this->vendorUser->assignRole(Roles::VENDOR_ADMIN);

        $this->vendor = Vendor::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->vendorUser->id,
            'company_name' => 'Gosika Tech Vendor',
            'business_email' => 'tech@gosika.com',
            'business_phone' => '9800000010',
            'status' => VendorStatus::APPROVED,
        ]);

        $this->store = Store::create([
            'uuid' => (string) Str::uuid(),
            'vendor_id' => $this->vendor->id,
            'name' => 'Gosika Gadgets Store',
            'slug' => 'gosika-gadgets-' . Str::random(6),
            'status' => StoreStatus::ACTIVE,
        ]);

        StoreAddress::create([
            'store_id' => $this->store->id,
            'address_line_1' => 'Putalisadak, Kathmandu',
            'district' => 'Kathmandu',
            'province' => 'Bagmati',
            'is_pickup_default' => true,
        ]);

        // Delivery Partner 1 (Approved & Online)
        $this->riderUser1 = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Rider',
            'last_name' => 'One',
            'email' => 'rider1@gosika.com',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $this->riderUser1->assignRole(Roles::DELIVERY_PARTNER);

        $this->rider1 = DeliveryPartner::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->riderUser1->id,
            'name' => 'Rider One',
            'phone' => '9800000001',
            'email' => 'rider1@gosika.com',
            'vehicle_type' => 'motorcycle',
            'service_areas' => ['Kathmandu', 'Lalitpur'],
            'status' => DeliveryPartnerStatus::APPROVED,
            'is_online' => true,
        ]);

        // Delivery Partner 2 (Approved & Online)
        $this->riderUser2 = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Rider',
            'last_name' => 'Two',
            'email' => 'rider2@gosika.com',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $this->riderUser2->assignRole(Roles::DELIVERY_PARTNER);

        $this->rider2 = DeliveryPartner::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $this->riderUser2->id,
            'name' => 'Rider Two',
            'phone' => '9800000002',
            'email' => 'rider2@gosika.com',
            'vehicle_type' => 'motorcycle',
            'service_areas' => ['Kathmandu', 'Bhaktapur'],
            'status' => DeliveryPartnerStatus::APPROVED,
            'is_online' => true,
        ]);
    }

    protected function createTestOrder(OrderStatus $status = OrderStatus::READY_FOR_PICKUP, bool $isCod = false): array
    {
        $customer = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Ram',
            'last_name' => 'Shrestha',
            'email' => 'customer' . Str::random(8) . '@gosika.com',
            'phone' => '98' . random_int(10000000, 99999999),
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
            'subtotal' => 2500.00,
            'delivery_charge' => 150.00,
            'grand_total' => 2650.00,
            'currency' => 'NPR',
            'shipping_address_snapshot' => json_encode([
                'full_name' => 'Ram Shrestha',
                'phone' => '9812345678',
                'address_line_1' => 'Boudha, Stupa Road',
                'municipality' => 'Kathmandu Metropolitan',
                'district' => 'Kathmandu',
                'province' => 'Bagmati',
            ]),
        ]);

        $vendorOrder = VendorOrder::create([
            'uuid' => (string) Str::uuid(),
            'vendor_order_number' => 'VO-' . strtoupper(Str::random(8)),
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'store_id' => $this->store->id,
            'status' => $status,
            'delivery_status' => DeliveryStatus::PENDING,
            'items_subtotal' => 2500.00,
            'delivery_charge' => 150.00,
            'grand_total' => 2650.00,
        ]);

        OrderItem::create([
            'uuid' => (string) Str::uuid(),
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'vendor_id' => $this->vendor->id,
            'product_name' => 'Wireless Bluetooth Earbuds',
            'quantity' => 2,
            'unit_price' => 1250.00,
            'line_total' => 2500.00,
        ]);

        return [$order, $vendorOrder];
    }

    // ── 1. Vendor marks shipment ready for pickup ──────────────────────────

    public function test_vendor_can_mark_accepted_order_ready_for_pickup(): void
    {
        [, $vendorOrder] = $this->createTestOrder(OrderStatus::ACCEPTED);

        $response = $this->actingAs($this->vendorUser)
            ->postJson("/api/v1/vendor/orders/{$vendorOrder->uuid}/ready-for-pickup");

        $response->assertStatus(200);
        $this->assertEquals(OrderStatus::READY_FOR_PICKUP, $vendorOrder->fresh()->status);
    }

    // ── 2. Unprepared shipments do NOT appear in available jobs ────────────

    public function test_unprepared_shipments_do_not_appear_as_available_jobs(): void
    {
        // One order is only ACCEPTED (not ready for pickup)
        $this->createTestOrder(OrderStatus::ACCEPTED);
        // One order is PENDING
        $this->createTestOrder(OrderStatus::PENDING);
        // One order is READY_FOR_PICKUP
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        $response = $this->actingAs($this->riderUser1)
            ->getJson('/api/v1/delivery-partner/available-jobs');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertCount(1, $data);
        $this->assertEquals($readyOrder->uuid, $data[0]['id']);
    }

    // ── 3. Eligible delivery user can view available jobs ──────────────────

    public function test_eligible_delivery_user_can_view_available_jobs_with_details(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP, isCod: true);

        $response = $this->actingAs($this->riderUser1)
            ->getJson('/api/v1/delivery-partner/available-jobs');

        $response->assertStatus(200);
        $job = $response->json('data.0');

        $this->assertEquals($readyOrder->uuid, $job['id']);
        $this->assertEquals('Ready for Pickup', $job['readiness_label']);
        $this->assertEquals($this->store->name, $job['pickup']['store_name']);
        $this->assertTrue($job['payment']['is_cod']);
        $this->assertEquals(2650.00, $job['payment']['cod_amount']);
        $this->assertEquals(150.00, $job['delivery_fee']);
        // Verify customer private phone is NOT leaked before claim
        $this->assertArrayNotHasKey('customer_phone', $job);
        $this->assertArrayNotHasKey('recipient_phone', $job['dropoff']);
    }

    // ── 4. Ineligible or inactive delivery user cannot claim a shipment ───

    public function test_inactive_or_offline_delivery_user_cannot_claim_shipment(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        // Rider goes offline
        $this->rider1->update(['is_online' => false]);

        $response = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");

        $response->assertStatus(422);
        $this->assertStringContainsString('online', $response->json('message'));
        $this->assertDatabaseMissing('delivery_assignments', ['vendor_order_id' => $readyOrder->id]);

        // Suspended rider cannot claim
        $this->rider1->update(['is_online' => true, 'status' => DeliveryPartnerStatus::SUSPENDED]);

        $response2 = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");

        $response2->assertStatus(422);
    }

    // ── 5. Delivery user can successfully claim an unassigned shipment ─────

    public function test_delivery_user_can_successfully_claim_unassigned_shipment(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP, isCod: true);

        $response = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");

        $response->assertStatus(200);
        $this->assertEquals('Shipment claimed successfully.', $response->json('message'));

        // Check assignment was recorded with correct attributes
        $assignment = DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->first();
        $this->assertNotNull($assignment);
        $this->assertEquals($this->rider1->id, $assignment->delivery_partner_id);
        $this->assertEquals(DeliveryStatus::ASSIGNED, $assignment->status);
        $this->assertEquals('self_claim', $assignment->meta['assignment_method']);
        $this->assertEquals($this->riderUser1->id, $assignment->created_by);
        $this->assertEquals(2650.00, (float) $assignment->cod_amount);

        // VendorOrder delivery status updated to ASSIGNED
        $this->assertEquals(DeliveryStatus::ASSIGNED, $readyOrder->fresh()->delivery_status);
    }

    // ── 6. Another user cannot claim the same shipment (Conflict 409) ──────

    public function test_another_delivery_user_cannot_claim_already_claimed_shipment(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        // Rider 1 claims
        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim")
            ->assertStatus(200);

        // Rider 2 tries to claim the same shipment
        $response = $this->actingAs($this->riderUser2)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");

        $response->assertStatus(409);
        $this->assertStringContainsString('already been claimed', $response->json('message'));

        // Ensure Rider 1 remains the only assigned partner
        $this->assertEquals(1, DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->count());
        $this->assertEquals($this->rider1->id, DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->first()->delivery_partner_id);
    }

    // ── 7. Super Admin can manually assign an eligible shipment ────────────

    public function test_super_admin_can_manually_assign_eligible_shipment(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $readyOrder->uuid,
                'delivery_partner_id' => $this->rider1->uuid,
                'notes' => 'Priority VIP assignment',
            ]);

        $response->assertStatus(201);

        $assignment = DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->first();
        $this->assertNotNull($assignment);
        $this->assertEquals($this->rider1->id, $assignment->delivery_partner_id);
        $this->assertEquals('manual_admin', $assignment->meta['assignment_method']);
        $this->assertEquals($this->adminUser->id, $assignment->created_by);
        $this->assertEquals('Priority VIP assignment', $assignment->meta['assignment_note'] ?? null);
    }

    // ── 8. Manual assignment and self-claim conflict handling ─────────────

    public function test_manual_assignment_and_self_claim_conflict_handling(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        // Super Admin manually assigns to Rider 1
        $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $readyOrder->uuid,
                'delivery_partner_id' => $this->rider1->uuid,
            ])
            ->assertStatus(201);

        // Rider 2 attempts to self-claim -> 409 Conflict
        $response = $this->actingAs($this->riderUser2)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");

        $response->assertStatus(409);

        // Super Admin attempts duplicate assignment without reassign -> 409 Conflict
        $response2 = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $readyOrder->uuid,
                'delivery_partner_id' => $this->rider2->uuid,
            ]);

        $response2->assertStatus(409);
    }

    // ── 9. Reassignment preserves previous assignment history ─────────────

    public function test_reassignment_preserves_previous_assignment_history(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        // First assigned to Rider 1
        $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $readyOrder->uuid,
                'delivery_partner_id' => $this->rider1->uuid,
            ])
            ->assertStatus(201);

        $assignment1 = DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->first();

        // Reassign to Rider 2
        $reassignResponse = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/deliveries/{$assignment1->uuid}/reassign", [
                'delivery_partner_id' => $this->rider2->uuid,
                'reason' => 'Rider motorcycle breakdown',
                'notes' => 'Transferred immediately to rider 2',
            ]);

        $reassignResponse->assertStatus(200);

        // Both assignments must be preserved in the database
        $assignments = DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->get();
        $this->assertCount(2, $assignments);

        $old = $assignments->firstWhere('delivery_partner_id', $this->rider1->id);
        $new = $assignments->firstWhere('delivery_partner_id', $this->rider2->id);

        $this->assertEquals(DeliveryStatus::FAILED, $old->status);
        $this->assertEquals($this->rider2->uuid, $old->meta['reassigned_to']);
        $this->assertEquals('Rider motorcycle breakdown', $old->meta['reassignment_reason']);

        $this->assertEquals(DeliveryStatus::ASSIGNED, $new->status);
        $this->assertEquals($assignment1->uuid, $new->meta['reassigned_from']);
        $this->assertEquals('Rider motorcycle breakdown', $new->meta['reassignment_reason']);
        $this->assertEquals('Transferred immediately to rider 2', $new->meta['reassignment_note']);
    }

    // ── 10. Ordinary reassignment is blocked after pickup ─────────────────

    public function test_ordinary_reassignment_is_blocked_after_pickup(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        // Assign to Rider 1
        $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $readyOrder->uuid,
                'delivery_partner_id' => $this->rider1->uuid,
            ]);

        $assignment = DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->first();

        // Rider accepts and picks up
        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/accept");
        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/pickup");

        $this->assertEquals(DeliveryStatus::PICKED_UP, $assignment->fresh()->status);

        // Admin attempts reassignment after pickup -> Must be blocked (422)
        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/deliveries/{$assignment->uuid}/reassign", [
                'delivery_partner_id' => $this->rider2->uuid,
                'reason' => 'Transfer request after pickup',
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Shipment has already been picked up', $response->json('message'));
        $this->assertEquals($this->rider1->id, $assignment->fresh()->delivery_partner_id);
    }

    // ── 11. Delivered or cancelled shipments cannot be claimed ────────────

    public function test_delivered_or_cancelled_shipments_cannot_be_claimed(): void
    {
        [, $deliveredOrder] = $this->createTestOrder(OrderStatus::DELIVERED);
        [, $cancelledOrder] = $this->createTestOrder(OrderStatus::CANCELLED);

        // Claiming delivered shipment -> 409 / 422
        $resDelivered = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$deliveredOrder->uuid}/claim");
        $this->assertTrue(in_array($resDelivered->status(), [409, 422]));

        // Claiming cancelled shipment -> 409 / 422
        $resCancelled = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$cancelledOrder->uuid}/claim");
        $this->assertTrue(in_array($resCancelled->status(), [409, 422]));
    }

    // ── 12. Repeated self-claim by the same user is safe & idempotent ─────

    public function test_repeated_claim_by_same_rider_is_idempotent(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        $res1 = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");
        $res1->assertStatus(200);

        // Second identical claim returns 200 without creating duplicate
        $res2 = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");
        $res2->assertStatus(200);

        $this->assertEquals(1, DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->count());
    }

    // ── 14. Service area matching and eligibility filtering ─────────────

    public function test_service_area_restrictions_prevent_ineligible_claiming(): void
    {
        // Rider 1 only serves Kathmandu & Lalitpur.
        // Create an order in Pokhara
        $customer = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Hari',
            'last_name' => 'Gurung',
            'email' => 'pokhara' . Str::random(8) . '@gosika.com',
            'phone' => '98' . random_int(10000000, 99999999),
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);

        $order = Order::create([
            'uuid' => (string) Str::uuid(),
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'user_id' => $customer->id,
            'payment_method' => 'esewa',
            'payment_status' => OrderPaymentStatus::PAID,
            'status' => OrderStatus::READY_FOR_PICKUP,
            'subtotal' => 1500.00,
            'delivery_charge' => 100.00,
            'grand_total' => 1600.00,
            'currency' => 'NPR',
            'shipping_address_snapshot' => json_encode([
                'full_name' => 'Hari Gurung',
                'phone' => '9876543210',
                'address_line_1' => 'Lakeside Street 4',
                'municipality' => 'Pokhara Metropolitan',
                'district' => 'Kaski',
                'province' => 'Gandaki',
            ]),
        ]);

        $vendorOrder = VendorOrder::create([
            'uuid' => (string) Str::uuid(),
            'vendor_order_number' => 'VO-' . strtoupper(Str::random(8)),
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'store_id' => $this->store->id,
            'status' => OrderStatus::READY_FOR_PICKUP,
            'delivery_status' => DeliveryStatus::PENDING,
            'items_subtotal' => 1500.00,
            'delivery_charge' => 100.00,
            'grand_total' => 1600.00,
        ]);

        // Rider 1 queries available jobs -> Pokhara job does NOT appear in their list
        $response = $this->actingAs($this->riderUser1)
            ->getJson('/api/v1/delivery-partner/available-jobs');
        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertNotContains($vendorOrder->uuid, $ids);

        // Attempting to directly claim the out-of-area order -> 403 Forbidden
        $claimResponse = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$vendorOrder->uuid}/claim");
        $claimResponse->assertStatus(403);
        $this->assertStringContainsString('service areas', $claimResponse->json('message'));
    }

    // ── 15. COD delivery completion updates payment status to PAID ────────

    public function test_cod_delivery_completion_updates_payment_to_paid(): void
    {
        [$order, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP, isCod: true);

        // Rider 1 claims
        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");

        $assignment = DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->first();

        // Accept and Pickup
        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/accept");
        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/pickup");

        // Out for delivery -> OTP is not exposed to rider
        $outResponse = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/out-for-delivery");
        $outResponse->assertStatus(200);
        $this->assertNull($outResponse->json('meta.otp'));

        // Retrieve OTP from customer order detail
        $customer = $order->user;
        $customerResponse = $this->actingAs($customer)
            ->getJson("/api/v1/orders/{$order->uuid}");
        $customerResponse->assertStatus(200);
        $otp = $customerResponse->json('data.delivery_otp');
        $this->assertNotNull($otp);

        // Deliver with customer OTP
        $deliverResponse = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/deliver", [
                'otp' => $otp,
            ]);

        $deliverResponse->assertStatus(200);
        $this->assertEquals(DeliveryStatus::DELIVERED, $assignment->fresh()->status);
        $this->assertEquals(OrderStatus::DELIVERED, $readyOrder->fresh()->status);
        $this->assertEquals(OrderPaymentStatus::PAID, $order->fresh()->payment_status);
    }

    // ── 16. Super Admin assignment history endpoint ───────────────────────

    public function test_admin_can_retrieve_detailed_assignment_history(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        // Claimed by rider 1
        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");

        $historyResponse = $this->actingAs($this->adminUser)
            ->getJson("/api/v1/admin/deliveries/dispatch/{$readyOrder->uuid}/history");

        $historyResponse->assertStatus(200);
        $history = $historyResponse->json('data.history');

        $this->assertCount(1, $history);
        $this->assertEquals('self_claim', $history[0]['assignment_method']);
        $this->assertEquals('Delivery-User Claim', $history[0]['assignment_method_label']);
        $this->assertEquals('Rider One', $history[0]['partner']['name']);
    }

    // ── 17. Validation error exact message representation ─────────────────

    public function test_validation_error_returns_exact_validation_error_message(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        // Missing delivery_partner_id
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $readyOrder->uuid,
            ]);

        $response->assertStatus(422);
        $this->assertNotEquals('Validation failed.', $response->json('message'));
        $this->assertStringContainsString('delivery partner id field is required', strtolower($response->json('message')));
        $this->assertArrayHasKey('delivery_partner_id', $response->json('errors'));
    }

    public function test_reassign_validation_error_returns_exact_reason_required_message(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        $assignment = DeliveryAssignment::create([
            'uuid' => (string) Str::uuid(),
            'vendor_order_id' => $readyOrder->id,
            'delivery_partner_id' => $this->rider1->id,
            'status' => DeliveryStatus::ASSIGNED,
            'delivery_fee' => 100.00,
            'is_active' => true,
        ]);

        // Attempt reassign without reason
        $response = $this->actingAs($this->adminUser)
            ->postJson("/api/v1/admin/deliveries/{$assignment->uuid}/reassign", [
                'delivery_partner_id' => $this->rider2->uuid,
                'reason' => '',
            ]);

        $response->assertStatus(422);
        $this->assertEquals('A reassignment reason is required.', $response->json('message'));
        $this->assertArrayHasKey('reason', $response->json('errors'));
    }

    public function test_admin_can_assign_using_integer_or_uuid_ids(): void
    {
        [, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);

        // Pass integer IDs instead of UUID strings
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/v1/admin/deliveries', [
                'vendor_order_id' => $readyOrder->id,
                'delivery_partner_id' => $this->rider1->id,
                'notes' => 'Assigned with numeric IDs',
            ]);

        $response->assertStatus(201);
        $this->assertEquals($this->rider1->id, $readyOrder->fresh()->assignments()->active()->first()->delivery_partner_id);
    }

    public function test_delivery_otp_generated_and_available_in_customer_order_detail(): void
    {
        [$order, $readyOrder] = $this->createTestOrder(OrderStatus::READY_FOR_PICKUP);
        $customer = $order->user;

        // Claimed and picked up
        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/available-jobs/{$readyOrder->uuid}/claim");

        $assignment = DeliveryAssignment::where('vendor_order_id', $readyOrder->id)->first();

        $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/pickup");

        // Customer views order detail
        $customerResponse = $this->actingAs($customer)
            ->getJson("/api/v1/orders/{$order->uuid}");

        $customerResponse->assertStatus(200);
        $otp = $customerResponse->json('data.delivery_otp');

        $this->assertNotNull($otp);
        $this->assertEquals(6, strlen($otp));
        $this->assertTrue(ctype_digit($otp));

        // Delivery rider out-for-delivery does NOT expose OTP in response or assignment resource
        $outResponse = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/out-for-delivery");
        $outResponse->assertStatus(200);
        $this->assertNull($outResponse->json('meta.otp'));
        $this->assertArrayNotHasKey('delivery_otp', (array) $outResponse->json('data.meta'));

        $assignmentResponse = $this->actingAs($this->riderUser1)
            ->getJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}");
        $assignmentResponse->assertStatus(200);
        $this->assertArrayNotHasKey('delivery_otp', (array) $assignmentResponse->json('data.meta'));

        // Handover confirmation succeeds using customer's OTP
        $deliverResponse = $this->actingAs($this->riderUser1)
            ->postJson("/api/v1/delivery-partner/assignments/{$assignment->uuid}/deliver", [
                'otp' => $otp,
            ]);
        $deliverResponse->assertStatus(200);
        $this->assertEquals(DeliveryStatus::DELIVERED, $assignment->fresh()->status);
    }
}

