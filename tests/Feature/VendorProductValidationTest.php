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

class VendorProductValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_creation_requires_a_price_instead_of_failing_at_database_insert(): void
    {
        Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
        $vendor = User::factory()->create();
        $vendor->assignRole(Roles::VENDOR_ADMIN);
        $vendorProfile = Vendor::query()->create([
            'user_id' => $vendor->id,
            'company_name' => 'Approved Vendor',
            'business_email' => 'approved-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        Store::query()->create([
            'vendor_id' => $vendorProfile->id,
            'name' => 'Approved Store',
            'slug' => 'approved-store',
            'status' => 'active',
        ]);

        $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Product without a price',
                'sku' => 'TEST-PRICE-001',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['price']);

        $this->assertDatabaseMissing('products', [
            'sku' => 'TEST-PRICE-001',
        ]);

        $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Product with a price',
                'sku' => 'TEST-PRICE-002',
                'price' => '1250.50',
            ])
            ->assertCreated()
            ->assertJsonPath('data.price', '1250.50');

        $this->assertDatabaseHas('products', [
            'sku' => 'TEST-PRICE-002',
            'price' => '1250.50',
        ]);
    }
}
