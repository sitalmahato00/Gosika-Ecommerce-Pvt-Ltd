<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\BrandRequest;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    protected function approvedVendor(array $vendorData = []): array
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $companyName = $vendorData['company_name'] ?? 'Himalayan Handicrafts';

        $vendor = Vendor::query()->create(array_merge([
            'user_id' => $user->id,
            'company_name' => $companyName,
            'business_email' => $vendorData['business_email'] ?? 'shop@himalayan.com.np',
            'status' => VendorStatus::APPROVED,
        ], $vendorData));

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => $companyName.' Store',
            'slug' => Str::slug($companyName).'-'.$vendor->id,
            'contact_email' => 'shop@himalayan.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        return ['user' => $user, 'vendor' => $vendor, 'store' => $store];
    }

    protected function superAdmin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::SUPER_ADMIN);

        return $user;
    }

    protected function publishedProduct(Vendor $vendor, Store $store, array $overrides = []): Product
    {
        return Product::query()->create(array_merge([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Woolen Shawl',
            'slug' => 'woolen-shawl',
            'sku' => 'SKU-'.$vendor->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 50,
            'low_stock_threshold' => 5,
            'price' => 2500.00,
            'compare_at_price' => 3000.00,
        ], $overrides));
    }

    public function test_vendor_can_create_product_with_variants(): void
    {
        $setup = $this->approvedVendor();
        $this->actingAs($setup['user'], 'sanctum');

        $this->postJson('/api/v1/vendor/products', [
            'name' => 'Handwoven Pashmina',
            'sku' => 'PASH-001',
            'price' => 4500.00,
            'quantity' => 20,
            'weight_grams' => 200,
            'variants' => [
                ['sku' => 'PASH-001-RED', 'price' => 4500.00, 'quantity' => 10, 'options' => ['color' => 'Red']],
                ['sku' => 'PASH-001-BLUE', 'price' => 4600.00, 'quantity' => 10, 'options' => ['color' => 'Blue']],
            ],
            'attributes' => [
                ['name' => 'Material', 'values' => ['Pashmina']],
            ],
        ])->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', ProductStatus::DRAFT->value);

        $product = Product::query()->where('sku', 'PASH-001')->first();

        $this->assertNotNull($product);
        $this->assertTrue($product->is_variant);
        $this->assertSame(20, (int) $product->quantity);
        $this->assertSame('in_stock', $product->stock_status->value);
        $this->assertSame(2, $product->variants()->count());
        $this->assertSame(1, $product->attributes()->count());
    }

    public function test_product_can_be_submitted_and_approved(): void
    {
        $setup = $this->approvedVendor();
        $admin = $this->superAdmin();
        $product = $this->publishedProduct($setup['vendor'], $setup['store'], [
            'status' => ProductStatus::DRAFT,
        ]);

        $this->actingAs($setup['user'], 'sanctum')
            ->postJson('/api/v1/vendor/products/'.$product->uuid.'/submit')
            ->assertOk()
            ->assertJsonPath('data.status', ProductStatus::PENDING_REVIEW->value);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/products/'.$product->uuid.'/approve')
            ->assertOk()
            ->assertJsonPath('data.status', ProductStatus::PUBLISHED->value);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'status' => ProductStatus::PUBLISHED->value,
        ]);
    }

    public function test_product_rejection_sets_reason(): void
    {
        $setup = $this->approvedVendor();
        $admin = $this->superAdmin();
        $product = $this->publishedProduct($setup['vendor'], $setup['store'], [
            'status' => ProductStatus::PENDING_REVIEW,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/products/'.$product->uuid.'/reject', [
                'reason' => 'Inappropriate image',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', ProductStatus::DRAFT->value)
            ->assertJsonPath('data.rejection_reason', 'Inappropriate image');
    }

    public function test_vendor_can_update_own_product(): void
    {
        $setup = $this->approvedVendor();
        $product = $this->publishedProduct($setup['vendor'], $setup['store'], [
            'status' => ProductStatus::DRAFT,
        ]);

        $this->actingAs($setup['user'], 'sanctum')
            ->putJson('/api/v1/vendor/products/'.$product->uuid, [
                'name' => 'Woolen Shawl Deluxe',
                'sku' => $product->sku,
                'price' => 2800.00,
                'quantity' => 30,
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Woolen Shawl Deluxe');
    }

    public function test_vendor_cannot_update_another_vendors_product(): void
    {
        $setupA = $this->approvedVendor();
        $setupB = $this->approvedVendor(['company_name' => 'Other Crafts', 'business_email' => 'other@example.com']);
        $product = $this->publishedProduct($setupA['vendor'], $setupA['store']);

        $this->actingAs($setupB['user'], 'sanctum')
            ->putJson('/api/v1/vendor/products/'.$product->uuid, [
                'name' => 'Stolen Product',
                'sku' => 'STOLEN-1',
            ])
            ->assertStatus(404);
    }

    public function test_public_can_list_published_products_only(): void
    {
        $setup = $this->approvedVendor();
        $this->publishedProduct($setup['vendor'], $setup['store']);
        $this->publishedProduct($setup['vendor'], $setup['store'], [
            'name' => 'Draft Item',
            'slug' => 'draft-item',
            'sku' => 'SKU-DRAFT',
            'status' => ProductStatus::DRAFT,
        ]);

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_public_can_view_product_detail(): void
    {
        $setup = $this->approvedVendor();
        $product = $this->publishedProduct($setup['vendor'], $setup['store']);

        $this->getJson('/api/v1/products/'.$product->uuid)
            ->assertOk()
            ->assertJsonPath('data.name', 'Woolen Shawl')
            ->assertJsonPath('data.price', '2500.00');

        $this->assertSame(1, $product->fresh()->views_count);
    }

    public function test_vendor_can_request_brand_and_admin_approves(): void
    {
        $setup = $this->approvedVendor();
        $admin = $this->superAdmin();

        $this->actingAs($setup['user'], 'sanctum')
            ->postJson('/api/v1/vendor/brand-requests', [
                'brand_name' => 'Pashmina Kings',
                'reason' => 'We sell this brand exclusively.',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.status', ReviewStatus::PENDING->value);

        $brandRequest = BrandRequest::query()->first();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/brand-requests/'.$brandRequest->uuid.'/approve')
            ->assertOk()
            ->assertJsonPath('data.status', ReviewStatus::APPROVED->value);

        $this->assertDatabaseHas('brands', ['name' => 'Pashmina Kings', 'slug' => 'pashmina-kings']);
    }

    public function test_admin_can_manage_categories_and_brands(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/categories', [
                'name' => 'Handicrafts',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.slug', 'handicrafts');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/brands', [
                'name' => 'Nepali Arts',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.slug', 'nepali-arts');

        $this->assertDatabaseHas('categories', ['slug' => 'handicrafts', 'status' => 'active']);
        $this->assertDatabaseHas('brands', ['slug' => 'nepali-arts']);
    }

    public function test_customer_cannot_access_admin_product_review(): void
    {
        $customer = User::factory()->create();
        $customer->assignRole(Roles::CUSTOMER);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/admin/products/pending')
            ->assertStatus(403);
    }

    public function test_product_with_variant_image_uploads(): void
    {
        Storage::fake('public');

        $setup = $this->approvedVendor();
        $this->actingAs($setup['user'], 'sanctum');

        $response = $this->post('/api/v1/vendor/products', [
            'name' => 'Tee',
            'sku' => 'TEE-01',
            'price' => 1000.00,
            'variants' => [[
                'sku' => 'TEE-01-M',
                'price' => 1000.00,
                'quantity' => 5,
                'options' => ['size' => 'M'],
                'image' => UploadedFile::fake()->create('variant.jpg', 100, 'image/jpeg'),
            ]],
        ]);

        $response->assertStatus(201);

        $product = Product::query()->where('sku', 'TEE-01')->first();
        $variant = $product->variants()->first();

        $this->assertNotNull($variant->image);
        Storage::disk('public')->assertExists($variant->image);
    }
}
