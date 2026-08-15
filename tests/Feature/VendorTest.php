<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\KycStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VendorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    private function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::CUSTOMER);

        return $user;
    }

    private function superAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::SUPER_ADMIN);

        return $user;
    }

    public function test_user_can_apply_for_vendor_account(): void
    {
        $user = $this->customer();

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/vendor/apply', [
            'company_name' => 'Himalayan Handicrafts',
            'business_email' => 'shop@himalayanhandicrafts.com.np',
            'business_phone' => '9800000001',
            'pan_vat' => '608123456',
            'registration_number' => '123456',
        ])->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', VendorStatus::PENDING->value);

        $this->assertDatabaseHas('vendors', [
            'user_id' => $user->id,
            'status' => VendorStatus::PENDING->value,
        ]);
    }

    public function test_user_cannot_apply_twice(): void
    {
        $user = $this->customer();
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/vendor/apply', [
            'company_name' => 'Shop One',
            'business_email' => 'one@example.com',
        ])->assertStatus(201);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/vendor/apply', [
            'company_name' => 'Shop Two',
            'business_email' => 'two@example.com',
        ])->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_vendor_can_submit_kyc_and_upload_document(): void
    {
        Storage::fake('public');

        $user = $this->customer();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Himalayan Handicrafts',
            'business_email' => 'shop@himalayan.com.np',
            'status' => VendorStatus::PENDING,
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/vendor/kyc', [
            'owner_full_name' => 'Rita Shrestha',
            'owner_citizenship_number' => 'CIT-123456',
            'owner_email' => 'rita@example.com',
            'owner_phone' => '9800000002',
            'business_type' => 'retail',
            'address' => 'Biratnagar, Morang',
        ])->assertOk()
            ->assertJsonPath('data.status', KycStatus::SUBMITTED->value);

        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'status' => VendorStatus::UNDER_REVIEW->value,
        ]);

        $file = UploadedFile::fake()->create('citizenship.pdf', 100, 'application/pdf');

        $this->actingAs($user, 'sanctum')->post('/api/v1/vendor/documents', [
            'document_type' => 'citizenship_front',
            'file' => $file,
        ])->assertStatus(201)
            ->assertJsonPath('success', true);

        $document = \App\Modules\Vendor\Infrastructure\Models\VendorDocument::query()->first();

        $this->assertNotNull($document);
        $this->assertSame($vendor->id, $document->vendor_id);
        $this->assertStringStartsWith('vendor-documents/'.$vendor->uuid.'/', $document->file_path);
        Storage::disk('public')->assertExists($document->file_path);
    }

    public function test_vendor_can_create_store_and_bank_account(): void
    {
        $user = $this->customer();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Himalayan Handicrafts',
            'business_email' => 'shop@himalayan.com.np',
            'status' => VendorStatus::APPROVED,
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/vendor/stores', [
            'name' => 'Himalayan Handicrafts Store',
            'description' => 'Handmade crafts from Koshi',
            'contact_email' => 'shop@himalayan.com.np',
            'contact_phone' => '9800000001',
        ])->assertStatus(201)
            ->assertJsonPath('data.status', StoreStatus::DRAFT->value);

        $this->assertDatabaseHas('stores', [
            'vendor_id' => $vendor->id,
            'slug' => 'himalayan-handicrafts-store',
            'status' => StoreStatus::DRAFT->value,
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/vendor/bank-accounts', [
            'bank_name' => 'Nabil Bank',
            'branch_name' => 'Biratnagar',
            'account_name' => 'Himalayan Handicrafts',
            'account_number' => '1100123456789001',
            'account_type' => 'savings',
        ])->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    public function test_super_admin_can_approve_and_reject_vendor(): void
    {
        $admin = $this->superAdmin();
        $user = $this->customer();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Himalayan Handicrafts',
            'business_email' => 'shop@himalayan.com.np',
            'status' => VendorStatus::UNDER_REVIEW,
        ]);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/vendors/'.$vendor->uuid.'/approve')
            ->assertOk()
            ->assertJsonPath('data.status', VendorStatus::APPROVED->value);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/vendors/'.$vendor->uuid.'/reject', [
            'reason' => 'Invalid PAN',
        ])->assertOk()
            ->assertJsonPath('data.status', VendorStatus::REJECTED->value);
    }

    public function test_reject_requires_reason(): void
    {
        $admin = $this->superAdmin();
        $user = $this->customer();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Himalayan Handicrafts',
            'business_email' => 'shop@himalayan.com.np',
            'status' => VendorStatus::UNDER_REVIEW,
        ]);

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/vendors/'.$vendor->uuid.'/reject', [])
            ->assertStatus(422);
    }

    public function test_customer_cannot_access_admin_vendor_review(): void
    {
        $user = $this->customer();

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/admin/vendors')
            ->assertStatus(403);
    }
}
