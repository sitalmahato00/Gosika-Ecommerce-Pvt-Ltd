<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VendorStoreProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_can_update_store_profile_without_losing_approval_or_reusing_own_slug_conflict(): void
    {
        Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Approved Store Vendor',
            'business_email' => 'approved-store-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Fashion Store',
            'slug' => 'fashion',
            'logo' => 'uploads/stores/old-logo.png',
            'banner' => 'uploads/stores/old-banner.png',
            'status' => 'active',
            'approved_at' => now()->subDay(),
        ]);
        $approvedAt = $store->approved_at->toISOString();

        $this->actingAs($user)
            ->putJson('/api/v1/vendor/stores/'.$store->uuid, [
                'name' => 'Updated Fashion Store',
                'slug' => 'fashion',
                'description' => 'Updated storefront details',
                'logo' => 'uploads/stores/new-logo.png',
                'banner' => 'uploads/stores/new-banner.png',
            ])
            ->assertOk()
            ->assertJsonPath('data.slug', 'fashion')
            ->assertJsonPath('data.logo', 'uploads/stores/new-logo.png')
            ->assertJsonPath('data.banner', 'uploads/stores/new-banner.png')
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.approved_at', $approvedAt);

        $this->assertDatabaseHas('stores', [
            'id' => $store->id,
            'name' => 'Updated Fashion Store',
            'slug' => 'fashion',
            'status' => 'active',
            'logo' => 'uploads/stores/new-logo.png',
            'banner' => 'uploads/stores/new-banner.png',
        ]);
    }

    public function test_vendor_can_change_store_slug_but_not_to_another_stores_slug(): void
    {
        Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Store Slug Vendor',
            'business_email' => 'store-slug-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'First Store',
            'slug' => 'first-store',
            'status' => 'active',
        ]);
        Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Second Store',
            'slug' => 'second-store',
            'status' => 'active',
        ]);

        $this->actingAs($user)
            ->putJson('/api/v1/vendor/stores/'.$store->uuid, [
                'name' => 'Renamed First Store',
                'slug' => 'renamed-first-store',
            ])
            ->assertOk()
            ->assertJsonPath('data.slug', 'renamed-first-store')
            ->assertJsonPath('data.status', 'active');

        $this->actingAs($user)
            ->putJson('/api/v1/vendor/stores/'.$store->uuid, [
                'name' => 'Renamed First Store',
                'slug' => 'second-store',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['slug']);

        $this->assertDatabaseHas('stores', [
            'id' => $store->id,
            'slug' => 'renamed-first-store',
            'status' => 'active',
        ]);
    }
}
