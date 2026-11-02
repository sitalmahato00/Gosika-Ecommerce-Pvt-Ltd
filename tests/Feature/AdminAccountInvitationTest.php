<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Application\Mail\AdminAccountInvitationMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminAccountInvitationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (Permissions::ALL as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $adminRole = Role::firstOrCreate(['name' => Roles::SUPER_ADMIN, 'guard_name' => 'web']);
        $adminRole->givePermissionTo(Permissions::ALL);
        Role::firstOrCreate(['name' => Roles::VENDOR_ADMIN, 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => Roles::DELIVERY_PARTNER, 'guard_name' => 'web']);

        $this->admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.test',
            'password' => 'admin-password',
            'status' => 'active',
        ]);
        $this->admin->assignRole(Roles::SUPER_ADMIN);
    }

    public function test_admin_created_staff_seller_and_delivery_accounts_receive_invitation_links(): void
    {
        Mail::fake();

        $this->actingAs($this->admin)->postJson('/api/v1/admin/users', [
            'first_name' => 'Staff',
            'last_name' => 'Member',
            'email' => 'staff@example.test',
            'roles' => [Roles::SUPER_ADMIN],
        ])->assertCreated();

        $this->actingAs($this->admin)->postJson('/api/v1/admin/vendors/create-seller', [
            'first_name' => 'Seller',
            'last_name' => 'Member',
            'email' => 'seller@example.test',
            'phone' => '9800000001',
            'company_name' => 'Test Seller Company',
        ])->assertCreated();

        $this->actingAs($this->admin)->postJson('/api/v1/admin/delivery-partners', [
            'name' => 'Delivery Member',
            'email' => 'delivery@example.test',
            'phone' => '9800000002',
        ])->assertCreated();

        Mail::assertSent(AdminAccountInvitationMail::class, 3);

        foreach (['staff@example.test', 'seller@example.test', 'delivery@example.test'] as $email) {
            $user = User::where('email', $email)->firstOrFail();
            $invitation = $user->meta['admin_account_invitation'] ?? null;

            $this->assertNotNull($invitation);
            $this->assertNull($user->email_verified_at);
            $this->assertNotEmpty($invitation['token_hash']);
            $this->assertNotSame($invitation['token_hash'], $user->password);
        }
    }

    public function test_invitation_verifies_email_sets_password_and_cannot_be_reused(): void
    {
        Mail::fake();
        config(['app.frontend_url' => 'https://gosika.example']);

        $this->actingAs($this->admin)->postJson('/api/v1/admin/users', [
            'first_name' => 'Invited',
            'last_name' => 'User',
            'email' => 'invited@example.test',
            'roles' => [Roles::SUPER_ADMIN],
        ])->assertCreated();

        $invitationMail = null;
        Mail::assertSent(AdminAccountInvitationMail::class, function (AdminAccountInvitationMail $mail) use (&$invitationMail): bool {
            if ($mail->user->email !== 'invited@example.test') {
                return false;
            }

            $invitationMail = $mail;

            return true;
        });

        parse_str((string) parse_url($invitationMail->invitationUrl, PHP_URL_QUERY), $query);
        $payload = [
            'email' => 'invited@example.test',
            'token' => $query['token'],
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password',
        ];

        $this->postJson('/api/v1/auth/admin-invitation/complete', $payload)
            ->assertOk()
            ->assertJsonPath('data.user.email', 'invited@example.test');

        $user = User::where('email', 'invited@example.test')->firstOrFail();
        $this->assertNotNull($user->email_verified_at);
        $this->assertTrue(Hash::check('new-secure-password', $user->password));
        $this->assertArrayNotHasKey('admin_account_invitation', $user->meta ?? []);

        $this->postJson('/api/v1/auth/admin-invitation/complete', $payload)
            ->assertUnprocessable();
    }
}
