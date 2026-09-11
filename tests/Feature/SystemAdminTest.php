<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SystemAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
        $this->seed(\Database\Seeders\SettingsSeeder::class);
    }

    protected function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::SUPER_ADMIN);

        return $user;
    }

    public function test_admin_can_create_admin_user_with_roles(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'first_name' => 'Operations',
                'last_name' => 'Lead',
                'email' => 'ops@gosika.com.np',
                'phone' => '9800000000',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
                'roles' => [Roles::SUPER_ADMIN, Roles::DELIVERY_PARTNER],
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.email', 'ops@gosika.com.np')
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('users', [
            'email' => 'ops@gosika.com.np',
            'status' => 'active',
        ]);

        $created = User::where('email', 'ops@gosika.com.np')->firstOrFail();
        $this->assertTrue($created->hasRole(Roles::SUPER_ADMIN));
        $this->assertTrue($created->hasRole(Roles::DELIVERY_PARTNER));
    }

    public function test_create_user_requires_confirmation_and_unique_email(): void
    {
        $admin = $this->admin();
        User::factory()->create(['email' => 'taken@gosika.com.np']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'first_name' => 'Bad',
                'email' => 'taken@gosika.com.np',
                'password' => 'secret123',
                'password_confirmation' => 'other123',
            ])
            ->assertStatus(422);
    }

    public function test_admin_can_assign_roles_to_user(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users/'.$user->uuid.'/roles', [
                'roles' => [Roles::DELIVERY_PARTNER],
            ])
            ->assertOk()
            ->assertJsonPath('data.roles.0', Roles::DELIVERY_PARTNER);

        $this->assertTrue($user->fresh()->hasRole(Roles::DELIVERY_PARTNER));
        $this->assertFalse($user->fresh()->hasRole(Roles::SUPER_ADMIN));
    }

    public function test_admin_can_reset_password_and_revoke_sessions(): void
    {
        $admin = $this->admin();
        $user = User::factory()->create(['password' => 'old-password']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users/'.$user->uuid.'/reset-password', [
                'password' => 'brand-new-password',
                'password_confirmation' => 'brand-new-password',
            ])
            ->assertOk();

        // Old password no longer authenticates
        $this->postJson('/api/v1/auth/login', [
            'identifier' => $user->email,
            'password' => 'old-password',
        ])->assertStatus(401);

        // New password works
        $this->postJson('/api/v1/auth/login', [
            'identifier' => $user->email,
            'password' => 'brand-new-password',
        ])->assertOk()->assertJsonPath('data.user.email', $user->email);
    }

    public function test_non_admin_cannot_manage_users(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole(Roles::CUSTOMER);

        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'first_name' => 'Nope',
                'email' => 'nope@gosika.com.np',
                'password' => 'secret123',
                'password_confirmation' => 'secret123',
            ])
            ->assertForbidden();
    }

    public function test_system_logs_list_and_view(): void
    {
        $admin = $this->admin();
        $logPath = storage_path('logs/system-test.log');
        file_put_contents($logPath, "[2026-09-11 10:00:00] production.INFO: Seeded test message\n[2026-09-11 10:00:01] production.ERROR: Something failed payload\n");

        try {
            $files = $this->actingAs($admin, 'sanctum')
                ->getJson('/api/v1/admin/logs')
                ->assertOk()
                ->json('data');

            $this->assertTrue(collect($files)->contains('name', 'system-test.log'));

            $this->actingAs($admin, 'sanctum')
                ->getJson('/api/v1/admin/logs/view?file=system-test.log&lines=100')
                ->assertOk()
                ->assertJsonPath('data.file', 'system-test.log')
                ->assertJsonStructure(['data' => ['lines' => [['n', 'level', 'ts', 'content']]]]);

            $this->actingAs($admin, 'sanctum')
                ->getJson('/api/v1/admin/logs/view?file=system-test.log&level=ERROR')
                ->assertOk()
                ->assertJsonCount(1, 'data.lines')
                ->assertJsonPath('data.lines.0.level', 'ERROR');
        } finally {
            @unlink($logPath);
        }
    }

    public function test_system_logs_restrict_path_traversal(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/logs/view?file=..%2F..%2F..%2F.env')
            ->assertStatus(404);
    }

    public function test_logo_upload_saves_and_returns_storage_url(): void
    {
        $admin = $this->admin();
        Storage::fake('public');

        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=');

        $response = $this->actingAs($admin, 'sanctum')
            ->post('/api/v1/admin/settings/branding', [
                'brand_name' => 'GOSIKA',
                'logo_light_file' => UploadedFile::fake()->createWithContent('logo-light.png', $png, null, 'image/png'),
            ]);

        $response->assertOk()
            ->assertJsonPath('data.brand_name', 'GOSIKA');

        $this->assertStringStartsWith('/storage/branding/', $response->json('data.logo_light'));

        $this->assertNotNull(Setting::where('key', 'branding.logo_light')->orWhere('key', 'logo_light')->first());
    }
}