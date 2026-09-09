<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\SellerTier;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\StoreAddress;
use App\Modules\Vendor\Infrastructure\Models\StoreOperatingHour;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class MarketplaceStoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    protected function approvedVendorWithStore(): array
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Kathmandu Crafts',
            'business_email' => 'crafts@example.com',
            'business_phone' => '9800000999',
            'pan_vat' => '301234321',
            'registration_number' => 'DPR-2025-0101',
            'status' => VendorStatus::APPROVED,
        ]);

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Kathmandu Crafts',
            'slug' => 'kathmandu-crafts',
            'logo' => 'https://example.com/logo.png',
            'banner' => 'https://example.com/banner.png',
            'description' => 'A demo handicraft storefront.',
            'contact_email' => 'crafts@example.com',
            'contact_phone' => '9800000888',
            'status' => StoreStatus::ACTIVE,
        ]);

        StoreAddress::query()->create([
            'store_id' => $store->id,
            'address_type' => 'business',
            'address_line_1' => 'Thamel Marg',
            'postal_code' => '44600',
        ]);

        for ($day = 0; $day < 7; $day++) {
            StoreOperatingHour::query()->create([
                'store_id' => $store->id,
                'day_of_week' => $day,
                'opens_at' => '09:00',
                'closes_at' => '19:00',
                'is_closed' => false,
            ]);
        }

        return ['user' => $user, 'vendor' => $vendor, 'store' => $store];
    }

    public function test_public_can_open_store_by_slug_or_uuid(): void
    {
        $setup = $this->approvedVendorWithStore();

        $this->getJson('/api/v1/marketplace/stores/'.$setup['store']->slug)
            ->assertOk()
            ->assertJsonPath('data.slug', 'kathmandu-crafts');

        $this->getJson('/api/v1/marketplace/stores/'.$setup['store']->uuid)
            ->assertOk()
            ->assertJsonPath('data.name', 'Kathmandu Crafts');
    }

    public function test_store_detail_exposes_contact_hours_and_media(): void
    {
        $setup = $this->approvedVendorWithStore();

        $response = $this->getJson('/api/v1/marketplace/stores/'.$setup['store']->slug)->assertOk();

        $data = $response->json('data');
        $this->assertSame('https://example.com/logo.png', $data['logo']);
        $this->assertSame('https://example.com/banner.png', $data['banner']);
        $this->assertSame('crafts@example.com', $data['contact_email']);
        $this->assertSame('9800000888', $data['contact_phone']);
        $this->assertSame('Thamel Marg', $data['location']);
        $this->assertSame('44600', $data['address']['postal_code']);
        $this->assertCount(7, $data['operating_hours']);
        $this->assertTrue($data['verified']);
    }

    public function test_store_products_resolve_by_slug(): void
    {
        $setup = $this->approvedVendorWithStore();

        Product::query()->create([
            'vendor_id' => $setup['vendor']->id,
            'store_id' => $setup['store']->id,
            'name' => 'Bamboo Hairpin',
            'slug' => 'bamboo-hairpin',
            'sku' => 'BAM-001',
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 20,
            'price' => 350.00,
        ]);

        $this->getJson('/api/v1/marketplace/stores/'.$setup['store']->slug.'/products')
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_admin_can_manage_tiers_and_assign_to_vendor(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Roles::SUPER_ADMIN);
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/v1/admin/marketplace/tiers', [
            'name' => 'Gold Seller',
            'badge_level' => 2,
            'min_orders' => 50,
            'min_gmv' => 250000,
            'commission_percent' => 8,
            'badge_color' => '#eab308',
            'badge_icon' => 'Medal',
            'benefits' => ['Reduced commission', 'Spotlight rotation'],
            'is_active' => true,
        ])->assertStatus(201)
            ->assertJsonPath('data.name', 'Gold Seller');

        $tier = SellerTier::query()->where('slug', 'gold-seller')->first();
        $this->assertNotNull($tier);

        $setup = $this->approvedVendorWithStore();
        $this->actingAs($admin, 'sanctum');

        $this->postJson('/api/v1/admin/marketplace/tiers/vendors/'.$setup['vendor']->uuid.'/assign', [
            'tier_id' => $tier->uuid,
        ])->assertOk();

        $this->assertDatabaseHas('vendors', [
            'id' => $setup['vendor']->id,
            'seller_tier_id' => $tier->id,
        ]);

        $assignments = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/marketplace/tiers/assignments')
            ->assertOk()
            ->json('data');

        $this->assertCount(1, $assignments);
        $this->assertSame('Kathmandu Crafts', $assignments[0]['company_name']);
        $this->assertSame('Gold Seller', $assignments[0]['seller_tier']['name']);

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/admin/marketplace/tiers/'.$tier->uuid, [
                'name' => 'Gold Seller Plus',
                'min_orders' => 75,
            ])->assertOk()
            ->assertJsonPath('data.name', 'Gold Seller Plus');
    }

    public function test_admin_product_list_filters_by_vendor_uuid(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Roles::SUPER_ADMIN);

        $setup = $this->approvedVendorWithStore();

        Product::query()->create([
            'vendor_id' => $setup['vendor']->id,
            'store_id' => $setup['store']->id,
            'name' => 'Copper Mug',
            'slug' => Str::slug('copper mug-'.$setup['vendor']->id),
            'sku' => 'CUP-'.$setup['vendor']->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 10,
            'price' => 900.00,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/products?vendor_id='.$setup['vendor']->uuid)
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }
}