<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\UserStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminUserRoleAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        // Create system roles first
        $superAdminRole = Role::create(['name' => Roles::SUPER_ADMIN, 'guard_name' => 'web']);
        Role::create(['name' => Roles::VENDOR_ADMIN, 'guard_name' => 'web']);
        Role::create(['name' => Roles::DELIVERY_PARTNER, 'guard_name' => 'web']);
        Role::create(['name' => Roles::CUSTOMER, 'guard_name' => 'web']);

        // Give super admin role all permissions
        $superAdminRole->givePermissionTo(Permissions::ALL);

        // Create a super admin user for authentication
        $this->superAdmin = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'superadmin@test.com',
            'password' => 'password',
            'status' => UserStatus::ACTIVE,
        ]);
        $this->superAdmin->assignRole(Roles::SUPER_ADMIN);
    }

    public function test_can_create_admin_user_with_system_roles(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/v1/admin/users', [
                'first_name' => 'Test',
                'last_name' => 'Admin',
                'email' => 'testadmin@test.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'roles' => [Roles::SUPER_ADMIN],
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.email', 'testadmin@test.com');
        $response->assertJsonPath('data.roles.0', Roles::SUPER_ADMIN);
    }

    public function test_can_create_admin_user_with_custom_role(): void
    {
        // First create a custom role
        $customRole = Role::create(['name' => 'order_management', 'guard_name' => 'web']);

        // Now create a user with that custom role
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/v1/admin/users', [
                'first_name' => 'Order',
                'last_name' => 'Manager',
                'email' => 'ordermanager@test.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'roles' => ['order_management'],
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('data.email', 'ordermanager@test.com');
        $response->assertJsonPath('data.roles.0', 'order_management');
    }

    public function test_cannot_create_admin_user_with_non_existent_role(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/v1/admin/users', [
                'first_name' => 'Test',
                'last_name' => 'User',
                'email' => 'testuser@test.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'roles' => ['non_existent_role'],
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['roles.0']);
    }

    public function test_can_assign_custom_role_to_existing_user(): void
    {
        // Create a custom role
        $customRole = Role::create(['name' => 'content_manager', 'guard_name' => 'web']);

        // Create a user
        $user = User::create([
            'uuid' => (string) Str::uuid(),
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'testuser@test.com',
            'password' => 'password',
            'status' => UserStatus::ACTIVE,
        ]);
        $user->assignRole(Roles::CUSTOMER);

        // Update user's roles to include the custom role
        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/v1/admin/users/{$user->uuid}/roles", [
                'roles' => ['content_manager'],
            ]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.roles.0', 'content_manager');

        // Verify in database
        $this->assertTrue($user->fresh()->hasRole('content_manager'));
    }

    public function test_can_assign_multiple_roles_including_custom(): void
    {
        // Create a custom role
        $customRole = Role::create(['name' => 'inventory_manager', 'guard_name' => 'web']);

        // Create user with multiple roles including custom
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/v1/admin/users', [
                'first_name' => 'Multi',
                'last_name' => 'Role',
                'email' => 'multirole@test.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'roles' => [Roles::VENDOR_ADMIN, 'inventory_manager'],
            ]);

        $response->assertStatus(201);
        $this->assertCount(2, $response->json('data.roles'));
        $this->assertContains(Roles::VENDOR_ADMIN, $response->json('data.roles'));
        $this->assertContains('inventory_manager', $response->json('data.roles'));
    }
}
