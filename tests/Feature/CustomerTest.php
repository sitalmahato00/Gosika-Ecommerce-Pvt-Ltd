<?php

namespace Tests\Feature;

use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Customer\Infrastructure\Models\CustomerProfile;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Platform\Infrastructure\Models\Country;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerTest extends TestCase
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

    public function test_profile_is_created_on_first_fetch(): void
    {
        $user = $this->customer();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/customer/profile');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.id', fn ($id) => is_string($id));

        $this->assertDatabaseHas('customer_profiles', ['user_id' => $user->id]);
    }

    public function test_profile_can_be_updated(): void
    {
        $user = $this->customer();

        $response = $this->actingAs($user, 'sanctum')->putJson('/api/v1/customer/profile', [
            'gender' => 'female',
            'date_of_birth' => '1995-06-15',
            'preferences' => ['currency' => 'NPR', 'language' => 'en'],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.gender', 'female')
            ->assertJsonPath('data.date_of_birth', '1995-06-15')
            ->assertJsonPath('data.preferences.currency', 'NPR');
    }

    public function test_guest_cannot_access_profile(): void
    {
        $this->getJson('/api/v1/customer/profile')->assertUnauthorized();
    }

    public function test_address_crud(): void
    {
        $user = $this->customer();

        $storeResponse = $this->actingAs($user, 'sanctum')->postJson('/api/v1/customer/addresses', [
            'address_type' => 'shipping',
            'label' => 'Home',
            'full_name' => 'Test Customer',
            'phone' => '9812345678',
            'address_line_1' => 'Baluwatar',
            'address_line_2' => 'House 12',
            'postal_code' => '44600',
            'is_default' => true,
        ]);

        $storeResponse->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.label', 'Home')
            ->assertJsonPath('data.is_default', true);

        $addressId = $storeResponse->json('data.id');

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/customer/addresses')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $updateResponse = $this->actingAs($user, 'sanctum')->putJson("/api/v1/customer/addresses/{$addressId}", [
            'address_type' => 'shipping',
            'label' => 'Office',
            'phone' => '9812345678',
            'address_line_1' => 'New Road',
        ]);

        $updateResponse->assertOk()
            ->assertJsonPath('data.label', 'Office')
            ->assertJsonPath('data.address_line_1', 'New Road');

        $this->actingAs($user, 'sanctum')->deleteJson("/api/v1/customer/addresses/{$addressId}")
            ->assertNoContent();

        $this->assertSoftDeleted('customer_addresses', ['uuid' => $addressId]);
    }

    public function test_customer_cannot_access_another_users_address(): void
    {
        $owner = $this->customer();
        $other = $this->customer();

        $address = CustomerAddress::query()->create([
            'user_id' => $owner->id,
            'address_type' => 'shipping',
            'phone' => '9812345678',
            'address_line_1' => 'Baluwatar',
        ]);

        $this->actingAs($other, 'sanctum')->getJson("/api/v1/customer/addresses/{$address->uuid}")
            ->assertStatus(404);
    }

    public function test_set_default_clears_previous_defaults_of_same_type(): void
    {
        $user = $this->customer();

        $first = CustomerAddress::query()->create([
            'user_id' => $user->id,
            'address_type' => 'shipping',
            'phone' => '9812345678',
            'address_line_1' => 'First',
            'is_default' => true,
        ]);

        $second = CustomerAddress::query()->create([
            'user_id' => $user->id,
            'address_type' => 'shipping',
            'phone' => '9812345678',
            'address_line_1' => 'Second',
            'is_default' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/v1/customer/addresses/{$first->uuid}/default");

        $response->assertOk()
            ->assertJsonPath('data.default', $first->uuid);

        $this->assertDatabaseHas('customer_addresses', ['id' => $first->id, 'is_default' => true]);
        $this->assertDatabaseHas('customer_addresses', ['id' => $second->id, 'is_default' => false]);
    }

    public function test_address_with_location_references_resolves_uuids(): void
    {
        $user = $this->customer();
        $country = Country::query()->create(['name' => 'Nepal', 'code' => 'NP', 'phone_code' => '+977']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/v1/customer/addresses', [
            'address_type' => 'billing',
            'phone' => '9812345678',
            'address_line_1' => 'Dharan',
            'country_id' => $country->uuid,
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.country.name', 'Nepal');

        $address = CustomerAddress::first();
        $this->assertEquals($country->id, $address->country_id);
    }

    public function test_deleting_default_address_resets_profile_default(): void
    {
        $user = $this->customer();
        $profile = CustomerProfile::query()->create(['user_id' => $user->id]);

        $address = CustomerAddress::query()->create([
            'user_id' => $user->id,
            'address_type' => 'shipping',
            'phone' => '9812345678',
            'address_line_1' => 'Default',
            'is_default' => true,
        ]);

        $profile->update(['default_shipping_address_id' => $address->uuid]);

        $this->actingAs($user, 'sanctum')->deleteJson("/api/v1/customer/addresses/{$address->uuid}")
            ->assertNoContent();

        $this->assertDatabaseHas('customer_profiles', [
            'user_id' => $user->id,
            'default_shipping_address_id' => null,
        ]);
    }
}
