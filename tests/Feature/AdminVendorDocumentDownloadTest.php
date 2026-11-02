<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Infrastructure\Models\VendorDocument;
use App\Modules\Vendor\Infrastructure\Models\VendorKyc;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminVendorDocumentDownloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_kyc_details_include_submitted_store_and_bank_information(): void
    {
        $role = Role::findOrCreate(Roles::SUPER_ADMIN, 'web');
        $permission = Permission::findOrCreate(Permissions::VENDORS_VIEW, 'web');
        $role->givePermissionTo($permission);

        $admin = User::factory()->create();
        $admin->assignRole($role);

        $vendorUser = User::factory()->create();
        $vendor = Vendor::query()->create([
            'user_id' => $vendorUser->id,
            'company_name' => 'Submitted Company',
            'business_email' => 'submitted@example.com',
            'business_phone' => '9800000000',
            'pan_vat' => 'PAN-12345',
            'registration_number' => 'REG-12345',
        ]);
        $kyc = VendorKyc::query()->create([
            'vendor_id' => $vendor->id,
            'owner_full_name' => 'Submitted Owner',
            'owner_citizenship_number' => 'ID-12345',
            'owner_email' => 'owner@example.com',
            'owner_phone' => '9800000001',
            'business_type' => 'Private Limited',
            'address' => 'Main Road',
            'landmark' => 'Near Market',
            'province' => 'Bagmati',
            'district' => 'Kathmandu',
            'municipality' => 'Kathmandu Metropolitan',
            'latitude' => '27.7172',
            'longitude' => '85.3240',
            'status' => 'submitted',
        ]);
        Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Submitted Store',
            'slug' => 'submitted-store',
            'description' => 'Store details submitted by seller.',
            'contact_email' => 'store@example.com',
            'contact_phone' => '9800000002',
            'status' => 'draft',
        ]);
        BankAccount::query()->create([
            'vendor_id' => $vendor->id,
            'bank_name' => 'Test Bank',
            'branch_name' => 'Central Branch',
            'account_name' => 'Submitted Owner',
            'account_number' => '1234567890',
            'account_type' => 'savings',
        ]);

        $this->actingAs($admin)
            ->getJson("/api/v1/admin/vendors/kyc/{$kyc->uuid}")
            ->assertOk()
            ->assertJsonPath('data.vendor.company_name', 'Submitted Company')
            ->assertJsonPath('data.vendor.stores.0.name', 'Submitted Store')
            ->assertJsonPath('data.vendor.stores.0.description', 'Store details submitted by seller.')
            ->assertJsonPath('data.vendor.bank_accounts.0.account_number', '1234567890')
            ->assertJsonPath('data.landmark', 'Near Market')
            ->assertJsonPath('data.latitude', '27.7172');
    }

    public function test_admin_can_download_a_private_vendor_kyc_document(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('vendor-documents/citizenship.jpg', 'private document');

        $role = Role::findOrCreate(Roles::SUPER_ADMIN, 'web');
        $permission = Permission::findOrCreate(Permissions::VENDORS_VIEW, 'web');
        $role->givePermissionTo($permission);

        $admin = User::factory()->create();
        $admin->assignRole($role);

        $vendorUser = User::factory()->create();
        $vendor = Vendor::query()->create([
            'user_id' => $vendorUser->id,
            'company_name' => 'Gosika Store',
            'business_email' => 'vendor@example.com',
        ]);
        $document = VendorDocument::query()->create([
            'vendor_id' => $vendor->id,
            'document_type' => 'citizenship_front',
            'file_path' => 'vendor-documents/citizenship.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 16,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)
            ->get("/api/v1/admin/vendors/documents/{$document->id}/download");

        $response->assertOk();
        $this->assertStringContainsString(
            'citizenship.jpg',
            $response->headers->get('content-disposition')
        );
    }
}
