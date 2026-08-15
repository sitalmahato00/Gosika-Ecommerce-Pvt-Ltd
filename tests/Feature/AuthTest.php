<?php

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Identity\Infrastructure\Services\OtpService;
use App\Modules\Shared\Domain\Enums\UserStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Rita',
            'last_name' => 'Shrestha',
            'email' => 'rita@example.com',
            'phone' => '9812345678',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => ['user', 'token'],
                'meta',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'rita@example.com',
            'status' => UserStatus::PENDING->value,
        ]);
    }

    public function test_register_validates_password_confirmation(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'first_name' => 'Rita',
            'last_name' => 'Shrestha',
            'email' => 'rita2@example.com',
            'phone' => '9812345679',
            'password' => 'Password123',
            'password_confirmation' => 'wrong-password',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['password']]);
    }

    public function test_user_cannot_login_before_activation(): void
    {
        $user = User::factory()->create([
            'email' => 'pending@example.com',
            'phone' => '9812345670',
            'status' => UserStatus::PENDING,
        ]);
        $user->assignRole('customer');

        $this->postJson('/api/v1/auth/login', [
            'identifier' => 'pending@example.com',
            'password' => 'password',
        ])->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_user_can_login_and_access_me(): void
    {
        $user = User::factory()->create([
            'email' => 'active@example.com',
            'phone' => '9812345671',
            'status' => UserStatus::ACTIVE,
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);
        $user->assignRole('customer');

        $login = $this->postJson('/api/v1/auth/login', [
            'identifier' => 'active@example.com',
            'password' => 'password',
        ]);

        $login->assertStatus(200)
            ->assertJsonPath('success', true);

        $token = $login->json('data.token');

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'active@example.com')
            ->assertJsonPath('data.roles.0', 'customer');
    }

    public function test_phone_verification_activates_user(): void
    {
        $user = User::factory()->create([
            'email' => 'verify@example.com',
            'phone' => '9812345672',
            'status' => UserStatus::PENDING,
            'email_verified_at' => now(),
            'phone_verified_at' => null,
        ]);
        $user->assignRole('customer');

        $otp = app(OtpService::class)->generate($user->phone);

        $this->actingAs($user)->postJson('/api/v1/auth/phone/verify', [
            'code' => $otp,
        ])->assertOk()
            ->assertJsonPath('data.status', UserStatus::ACTIVE->value);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'status' => UserStatus::ACTIVE->value,
        ]);

        $this->assertNotNull($user->fresh()->phone_verified_at);
    }

    public function test_login_with_phone_identifier(): void
    {
        $user = User::factory()->create([
            'email' => 'phone-user@example.com',
            'phone' => '9812345673',
            'status' => UserStatus::ACTIVE,
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
        ]);
        $user->assignRole('customer');

        $this->postJson('/api/v1/auth/login', [
            'identifier' => '9812345673',
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('data.user.phone', '9812345673');
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
        $user->assignRole('customer');

        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout')
            ->assertStatus(204);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
