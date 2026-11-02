<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Infrastructure\Models\VendorDocument;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminVendorDocumentDownloadTest extends TestCase
{
    use RefreshDatabase;

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
