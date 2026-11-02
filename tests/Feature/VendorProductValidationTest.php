<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class VendorProductValidationTest extends TestCase
{
    use RefreshDatabase;

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
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated product name')
            ->assertJsonPath('data.price', '1300.00');

        $this->assertDatabaseHas('products', [
            'sku' => 'TEST-PRICE-002',
            'name' => 'Updated product name',
        ]);

        $imageUrl = 'https://example.test/product-photo.jpg';
        $this->actingAs($vendor)
            ->post('/api/v1/vendor/products/'.$productId, [
                '_method' => 'PUT',
                'name' => 'Updated product name',
                'sku' => 'TEST-PRICE-002',
                'price' => '1300.00',
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
    }
}
