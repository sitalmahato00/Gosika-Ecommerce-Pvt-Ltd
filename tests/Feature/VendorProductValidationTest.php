<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VendorProductValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_creation_requires_a_store_and_returns_an_actionable_error(): void
    {
        Storage::fake('public');

        Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
        $vendor = User::factory()->create();
        $vendor->assignRole(Roles::VENDOR_ADMIN);
        Vendor::query()->create([
            'user_id' => $vendor->id,
            'company_name' => 'Storeless Vendor',
            'business_email' => 'storeless-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);

        $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Product without a store',
                'sku' => 'TEST-NO-STORE-001',
                'price' => '100',
                'image_urls' => ['https://example.test/no-store.jpg'],
            ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Create a store profile and submit it for approval before listing products.')
            ->assertJsonPath('errors.store.0', 'Create a store profile and submit it for approval before listing products.');

        $this->assertDatabaseMissing('products', [
            'sku' => 'TEST-NO-STORE-001',
        ]);
    }

    public function test_product_creation_requires_store_approval(): void
    {
        Storage::fake('public');

        Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
        $vendor = User::factory()->create();
        $vendor->assignRole(Roles::VENDOR_ADMIN);
        $vendorProfile = Vendor::query()->create([
            'user_id' => $vendor->id,
            'company_name' => 'Pending Store Vendor',
            'business_email' => 'pending-store-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        $store = Store::query()->create([
            'vendor_id' => $vendorProfile->id,
            'name' => 'Pending Store',
            'slug' => 'pending-store',
            'status' => 'draft',
        ]);

        $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Product from unapproved store',
                'sku' => 'TEST-UNAPPROVED-STORE-001',
                'price' => '100',
                'image_urls' => ['https://example.test/unapproved-store.jpg'],
            ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Complete your store profile and submit it for approval before listing products.'
            );

        $store->update(['status' => 'pending_approval']);

        $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Product awaiting store approval',
                'sku' => 'TEST-PENDING-STORE-001',
                'price' => '100',
                'image_urls' => ['https://example.test/pending-store.jpg'],
            ])
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Your store is awaiting approval. You can list products after an administrator approves it.'
            );

        $this->assertDatabaseMissing('products', [
            'sku' => 'TEST-UNAPPROVED-STORE-001',
        ]);
        $this->assertDatabaseMissing('products', [
            'sku' => 'TEST-PENDING-STORE-001',
        ]);

        $store->update(['status' => 'active']);
        $productId = $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Product awaiting store approval',
                'sku' => 'TEST-STORE-SUSPENSION-001',
                'price' => '100',
                'image_urls' => ['https://example.test/store-suspension.jpg'],
            ])
            ->assertCreated()
            ->json('data.id');

        $store->update(['status' => 'pending_approval']);

        $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products/'.$productId.'/submit')
            ->assertUnprocessable()
            ->assertJsonPath(
                'message',
                'Your store is awaiting approval. You can list products after an administrator approves it.'
            );
    }

    public function test_vendor_product_unique_conflicts_are_reported_as_conflicts(): void
    {
        DB::table('categories')->insert([
            'uuid' => (string) Str::uuid(),
            'name' => 'Conflict Test',
            'slug' => 'conflict-test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Route::post('/api/v1/vendor/products/test-unique-conflict', function () {
            DB::table('categories')->insert([
                'uuid' => (string) Str::uuid(),
                'name' => 'Duplicate Conflict Test',
                'slug' => 'conflict-test',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        $this->postJson('/api/v1/vendor/products/test-unique-conflict')
            ->assertConflict()
            ->assertJsonPath(
                'message',
                'This product conflicts with an existing product. Check the product and variant SKUs, then try again.'
            );
    }

    public function test_vendor_product_and_variant_skus_are_generated_when_omitted(): void
    {
            Storage::fake('public');
            Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
            $vendor = User::factory()->create();
            $vendor->assignRole(Roles::VENDOR_ADMIN);
            $vendorProfile = Vendor::query()->create([
                'user_id' => $vendor->id,
                'company_name' => 'Auto SKU Vendor',
                'business_email' => 'auto-sku-vendor@example.test',
                'status' => VendorStatus::APPROVED,
            ]);
            Store::query()->create([
                'vendor_id' => $vendorProfile->id,
                'name' => 'Auto SKU Store',
                'slug' => 'auto-sku-store',
                'status' => 'active',
            ]);

            $this->actingAs($vendor)
                ->postJson('/api/v1/vendor/products', [
                    'name' => 'Automatic SKU Product',
                    'price' => '100',
                    'image_urls' => ['https://example.test/auto-sku.jpg'],
                    'variants' => [
                        ['price' => '100', 'quantity' => '2'],
                    ],
                ])
                ->assertCreated();

            $product = Product::query()->where('vendor_id', $vendorProfile->id)->firstOrFail();
            $variant = $product->variants()->firstOrFail();
            $this->assertMatchesRegularExpression('/^GSK-'.$vendorProfile->id.'-PRD-[A-Z0-9]{8}$/', $product->sku);
            $this->assertMatchesRegularExpression('/^GSK-'.$vendorProfile->id.'-VAR1-[A-Z0-9]{8}$/', $variant->sku);
    }

    public function test_removed_variant_sku_can_be_reused_when_editing_a_product(): void
    {
        Storage::fake('public');

        Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
        $vendor = User::factory()->create();
        $vendor->assignRole(Roles::VENDOR_ADMIN);
        $vendorProfile = Vendor::query()->create([
            'user_id' => $vendor->id,
            'company_name' => 'Variant Vendor',
            'business_email' => 'variant-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        Store::query()->create([
            'vendor_id' => $vendorProfile->id,
            'name' => 'Variant Store',
            'slug' => 'variant-store',
            'status' => 'active',
        ]);

        $productId = $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Variant SKU Reuse Product',
                'sku' => 'TEST-VARIANT-REUSE-PARENT',
                'price' => '100',
                'image_urls' => ['https://example.test/variant-reuse.jpg'],
                'variants' => [
                    [
                        'sku' => 'TEST-VARIANT-REUSE-001',
                        'price' => '100',
                        'quantity' => '1',
                    ],
                ],
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($vendor)
            ->post('/api/v1/vendor/products/'.$productId, [
                '_method' => 'PUT',
                'name' => 'Variant SKU Reuse Product',
                'sku' => 'TEST-VARIANT-REUSE-PARENT',
                'price' => '100',
                'variants_present' => '1',
            ])
            ->assertOk();

        $this->actingAs($vendor)
            ->post('/api/v1/vendor/products/'.$productId, [
                '_method' => 'PUT',
                'name' => 'Variant SKU Reuse Product',
                'sku' => 'TEST-VARIANT-REUSE-PARENT',
                'price' => '100',
                'variants_present' => '1',
                'variants' => [
                    [
                        'sku' => 'TEST-VARIANT-REUSE-001',
                        'price' => '100',
                        'quantity' => '2',
                    ],
                ],
            ])
            ->assertOk();

        $this->assertDatabaseCount('product_variants', 1);
        $this->assertDatabaseHas('product_variants', [
            'sku' => 'TEST-VARIANT-REUSE-001',
            'deleted_at' => null,
            'quantity' => 2,
        ]);
    }

    public function test_vendor_can_edit_pending_and_published_products_without_changing_their_status(): void
    {
        Storage::fake('public');

        Role::findOrCreate(Roles::VENDOR_ADMIN, 'web');
        $vendor = User::factory()->create();
        $vendor->assignRole(Roles::VENDOR_ADMIN);
        $vendorProfile = Vendor::query()->create([
            'user_id' => $vendor->id,
            'company_name' => 'Product Editing Vendor',
            'business_email' => 'product-editing-vendor@example.test',
            'status' => VendorStatus::APPROVED,
        ]);
        Store::query()->create([
            'vendor_id' => $vendorProfile->id,
            'name' => 'Product Editing Store',
            'slug' => 'product-editing-store',
            'status' => 'active',
        ]);

        $productId = $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Product to edit',
                'sku' => 'TEST-EDITABLE-PRODUCT',
                'price' => '100',
                'image_urls' => ['https://example.test/editable-product.jpg'],
            ])
            ->assertCreated()
            ->json('data.id');

        $product = Product::query()->where('uuid', $productId)->firstOrFail();

        foreach ([ProductStatus::PENDING_REVIEW, ProductStatus::PUBLISHED] as $status) {
            $product->update(['status' => $status]);
            $name = 'Product updated while '.$status->value;

            $this->post('/api/v1/vendor/products/'.$productId, [
                '_method' => 'PUT',
                'name' => $name,
                'sku' => 'TEST-EDITABLE-PRODUCT',
                'price' => '125',
            ])
                ->assertOk()
                ->assertJsonPath('data.name', $name)
                ->assertJsonPath('data.status', $status->value);

            $this->assertDatabaseHas('products', [
                'uuid' => $productId,
                'name' => $name,
                'status' => $status->value,
            ]);

            $this->postJson('/api/v1/vendor/products/'.$productId.'/submit')
                ->assertUnprocessable()
                ->assertJsonPath('message', 'Only draft or hidden products can be submitted for review.');
        }

        $product->update(['status' => ProductStatus::ARCHIVED]);
        $this->post('/api/v1/vendor/products/'.$productId, [
            '_method' => 'PUT',
            'name' => 'Archived product update',
            'sku' => 'TEST-EDITABLE-PRODUCT',
            'price' => '125',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Product cannot be edited in its current state.');
    }

    public function test_product_creation_requires_a_price_instead_of_failing_at_database_insert(): void
    {
        Storage::fake('public');

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
            ->assertJsonValidationErrors(['price', 'images']);

        $this->assertDatabaseMissing('products', [
            'sku' => 'TEST-PRICE-001',
        ]);

        $created = $this->actingAs($vendor)
            ->post('/api/v1/vendor/products', [
                'name' => 'Product with a price',
                'sku' => 'TEST-PRICE-002',
                'price' => '1250.50',
                'barcode' => 'BAR-002',
                'cost_price' => '700.00',
                'hs_code' => '123456',
                'manufacturer' => 'Original maker',
                'tax_rate' => 13,
                'images' => [UploadedFile::fake()->createWithContent(
                    'product.jpg',
                    base64_decode('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==')
                )],
            ])
            ->assertCreated()
            ->assertJsonPath('data.price', '1250.50');

        $this->assertDatabaseHas('products', [
            'sku' => 'TEST-PRICE-002',
            'price' => '1250.50',
        ]);

        $productId = $created->json('data.id');

        $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Duplicate SKU product',
                'sku' => 'TEST-PRICE-002',
                'price' => '100',
                'image_urls' => ['https://example.test/duplicate.jpg'],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['sku'])
            ->assertJsonPath(
                'errors.sku.0',
                'This SKU is already used by another product in your store. Please choose a different SKU.'
            )
            ->assertDontSee('SQLSTATE');

        $this->actingAs($vendor)
            ->post('/api/v1/vendor/products/'.$productId, [
                '_method' => 'PUT',
                'name' => 'Updated product name',
                'sku' => 'TEST-PRICE-002',
                'price' => '1300.00',
                'compare_at_price' => '1500.00',
                'quantity' => '17',
                'low_stock_threshold' => '3',
                'weight_grams' => '450',
                'dimensions' => '10x20x3',
                'description' => 'Updated product description',
                'short_description' => 'Updated summary',
                'is_featured' => '1',
                'is_negotiable' => '1',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated product name')
            ->assertJsonPath('data.price', '1300.00')
            ->assertJsonPath('data.quantity', 17)
            ->assertJsonPath('data.low_stock_threshold', 3)
            ->assertJsonPath('data.compare_at_price', '1500.00')
            ->assertJsonPath('data.weight_grams', 450)
            ->assertJsonPath('data.dimensions', '10x20x3')
            ->assertJsonPath('data.description', 'Updated product description')
            ->assertJsonPath('data.short_description', 'Updated summary')
            ->assertJsonPath('data.is_featured', true)
            ->assertJsonPath('data.is_negotiable', true);

        $this->assertDatabaseHas('products', [
            'sku' => 'TEST-PRICE-002',
            'name' => 'Updated product name',
            'quantity' => 17,
            'low_stock_threshold' => 3,
            'weight_grams' => 450,
            'dimensions' => '10x20x3',
            'barcode' => 'BAR-002',
            'cost_price' => '700.00',
            'hs_code' => '123456',
            'manufacturer' => 'Original maker',
            'tax_rate' => 13,
        ]);

        $imageUrl = 'https://example.test/product-photo.jpg';
        $this->actingAs($vendor)
            ->post('/api/v1/vendor/products/'.$productId, [
                '_method' => 'PUT',
                'name' => 'Updated product name',
                'sku' => 'TEST-PRICE-002',
                'price' => '1300.00',
                'quantity' => '17',
                'image_urls' => [$imageUrl],
                'primary_image_url' => $imageUrl,
            ])
            ->assertOk();

        $this->assertDatabaseHas('product_images', [
            'product_id' => Product::query()
                ->where('uuid', $productId)
                ->value('id'),
            'file_path' => $imageUrl,
            'is_primary' => true,
        ]);
        $this->assertDatabaseCount('product_images', 2);

        $variantProductId = $this->actingAs($vendor)
            ->postJson('/api/v1/vendor/products', [
                'name' => 'Variant product',
                'sku' => 'TEST-VARIANT-PARENT',
                'price' => '100',
                'image_urls' => ['https://example.test/variant-product.jpg'],
                'variants' => [
                    [
                        'sku' => 'TEST-VARIANT-001',
                        'name' => 'Small',
                        'price' => '100',
                        'quantity' => '4',
                        'options' => ['size' => 'S'],
                    ],
                    [
                        'sku' => 'TEST-VARIANT-002',
                        'name' => 'Large',
                        'price' => '120',
                        'quantity' => '6',
                        'options' => ['size' => 'L'],
                    ],
                ],
            ])
            ->assertCreated()
            ->json('data.id');
        $variantProduct = $this->actingAs($vendor)
            ->getJson('/api/v1/vendor/products/'.$variantProductId)
            ->assertOk()
            ->json('data');

        $variantId = $variantProduct['variants'][0]['id'];
        $this->actingAs($vendor)
            ->post('/api/v1/vendor/products/'.$variantProduct['id'], [
                '_method' => 'PUT',
                'name' => 'Variant product updated',
                'sku' => 'TEST-VARIANT-PARENT',
                'price' => '100',
                'quantity' => '4',
                'variants_present' => '1',
                'variants' => [
                    [
                        'sku' => 'TEST-VARIANT-001',
                        'name' => 'Small',
                        'price' => '100',
                        'quantity' => '12',
                        'options' => ['size' => 'S'],
                    ],
                    [
                        'sku' => 'TEST-VARIANT-002',
                        'name' => 'Large',
                        'price' => '120',
                        'quantity' => '8',
                        'options' => ['size' => 'L'],
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.quantity', 20)
            ->assertJsonPath('data.variants.0.id', $variantId)
            ->assertJsonPath('data.variants.0.quantity', 12)
            ->assertJsonPath('data.variants.1.quantity', 8);

        $this->assertDatabaseHas('products', [
            'uuid' => $variantProduct['id'],
            'quantity' => 20,
        ]);
        $this->assertDatabaseHas('product_variants', [
            'product_id' => Product::query()->where('uuid', $variantProduct['id'])->value('id'),
            'sku' => 'TEST-VARIANT-001',
            'quantity' => 12,
        ]);
        $this->assertDatabaseCount('product_variants', 2);
    }
}
