<?php

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PortalRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_delivery_partner_cannot_access_admin_api_routes(): void
    {
        $deliveryPartner = $this->userWithRole('delivery_partner');

        $this->actingAs($deliveryPartner, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertForbidden();
    }

    public function test_super_admin_cannot_access_delivery_partner_api_routes(): void
    {
        $admin = $this->userWithRole('super_admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/delivery-partner/me')
            ->assertForbidden();
    }

    public function test_admin_cannot_access_customer_account_api_routes(): void
    {
        $admin = $this->userWithRole('super_admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/customer/profile')
            ->assertForbidden();
    }

    public function test_vendor_and_delivery_partner_cannot_access_customer_account_api_routes(): void
    {
        foreach (['vendor_admin', 'delivery_partner'] as $role) {
            $user = $this->userWithRole($role);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/customer/profile')
                ->assertForbidden();
        }
    }

    public function test_customer_can_access_customer_order_api_routes(): void
    {
        $customer = $this->userWithRole('customer');

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/orders')
            ->assertOk();
    }

    public function test_staff_role_with_permission_can_access_admin_api_routes(): void
    {
        $staff = $this->userWithRole('qa_orders_view_only');
        $role = Role::query()->where('name', 'qa_orders_view_only')->firstOrFail();
        $permission = Permission::query()->firstOrCreate([
            'name' => 'users.view',
            'guard_name' => 'web',
        ]);
        $role->givePermissionTo($permission);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertOk();
    }

    private function userWithRole(string $roleName): User
    {
        $role = Role::query()->firstOrCreate([
            'name' => $roleName,
            'guard_name' => 'web',
        ]);
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }
}
