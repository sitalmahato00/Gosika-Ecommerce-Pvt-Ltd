<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Shared\Domain\Enums\UserStatus;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminListingFiltersTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolePermissionSeeder::class);
        $this->admin = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Filter',
            'last_name' => 'Admin',
            'email' => 'filter-admin@gosika.test',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $this->admin->assignRole(Roles::SUPER_ADMIN);

        $this->customer = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Test',
            'last_name' => 'Customer',
            'email' => 'filter-customer@gosika.test',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $this->customer->assignRole(Roles::CUSTOMER);
    }

    public function test_admin_order_date_range_includes_the_entire_selected_day(): void
    {
        $this->createOrder('ORDER-EARLY', '2026-11-01 00:00:00');
        $this->createOrder('ORDER-LATE', '2026-11-01 23:59:59');
        $this->createOrder('ORDER-OUTSIDE', '2026-11-02 00:00:00');

        $response = $this->actingAs($this->admin)->getJson(
            '/api/v1/admin/orders?date_from=2026-11-01&date_to=2026-11-01'
        );

        $response->assertOk();
        $orders = $response->json('data');
        $this->assertCount(2, $orders);
        $this->assertEqualsCanonicalizing(
            ['ORDER-EARLY', 'ORDER-LATE'],
            array_column($orders, 'order_number'),
        );
    }

    public function test_admin_order_date_range_rejects_reversed_dates(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/v1/admin/orders?date_from=2026-11-02&date_to=2026-11-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('date_to');
    }

    public function test_customer_order_search_remains_scoped_to_the_authenticated_customer(): void
    {
        $otherCustomer = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Other',
            'last_name' => 'Customer',
            'email' => 'other-filter-customer@gosika.test',
            'password' => bcrypt('password'),
            'status' => UserStatus::ACTIVE,
        ]);
        $otherCustomer->assignRole(Roles::CUSTOMER);
        $this->createOrder('OWN-ORDER', '2026-11-01 10:00:00');
        Order::create([
            'uuid' => (string) Str::uuid(),
            'order_number' => 'OTHER-ORDER',
            'user_id' => $otherCustomer->id,
            'payment_method' => 'cod',
            'status' => 'pending',
            'payment_status' => 'pending',
            'grand_total' => 100,
            'placed_at' => '2026-11-01 10:00:00',
        ]);

        $response = $this->actingAs($this->customer)
            ->getJson('/api/v1/orders?search=ORDER');

        $response->assertOk();
        $orders = $response->json('data');
        $this->assertCount(1, $orders);
        $this->assertSame('OWN-ORDER', $orders[0]['order_number']);
    }

    private function createOrder(string $orderNumber, string $placedAt): Order
    {
        return Order::create([
            'uuid' => (string) Str::uuid(),
            'order_number' => $orderNumber,
            'user_id' => $this->customer->id,
            'payment_method' => 'cod',
            'status' => 'pending',
            'payment_status' => 'pending',
            'grand_total' => 100,
            'placed_at' => $placedAt,
        ]);
    }
}
