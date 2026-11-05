<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\StoreAddress;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicProductSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_defaults_to_highest_rated_products(): void
    {
        $store = $this->createStore('ratings');
        $lowerRated = $this->createProduct($store, 'Rating Search Shirt Low', 'RATING-LOW', 3.2);
        $higherRated = $this->createProduct($store, 'Rating Search Shirt High', 'RATING-HIGH', 4.9);

        $this->getJson('/api/v1/products?search=Rating%20Search%20Shirt')
            ->assertOk()
            ->assertJsonPath('data.0.id', $higherRated->uuid)
            ->assertJsonPath('data.1.id', $lowerRated->uuid);
    }

    public function test_nearby_products_are_ranked_before_more_distant_products(): void
    {
        $nearbyStore = $this->createStore('nearby');
        $distantStore = $this->createStore('distant');
        StoreAddress::query()->create([
            'store_id' => $nearbyStore->id,
            'address_type' => 'business',
            'address_line_1' => 'Nearby test address',
            'latitude' => '27.7000',
            'longitude' => '85.3000',
        ]);
        StoreAddress::query()->create([
            'store_id' => $distantStore->id,
            'address_type' => 'business',
            'address_line_1' => 'Distant test address',
            'latitude' => '28.0000',
            'longitude' => '85.6000',
        ]);

        $nearby = $this->createProduct($nearbyStore, 'Location Search Mug Nearby', 'LOCATION-NEAR', 3.0);
        $distant = $this->createProduct($distantStore, 'Location Search Mug Distant', 'LOCATION-FAR', 5.0);

        $this->getJson('/api/v1/products?search=Location%20Search%20Mug&latitude=27.7000&longitude=85.3000')
            ->assertOk()
            ->assertJsonPath('data.0.id', $nearby->uuid)
            ->assertJsonPath('data.1.id', $distant->uuid);
    }

    public function test_autocomplete_returns_product_uuid_rating_and_store_location(): void
    {
        $store = $this->createStore('autocomplete');
        $store->addresses()->create([
            'address_type' => 'business',
            'address_line_1' => 'Autocomplete test address',
        ]);
        $product = $this->createProduct($store, 'Autocomplete Test Product', 'AUTOCOMPLETE-001', 4.7);

        $this->getJson('/api/v1/products/suggestions?q=Autocomplete%20Test')
            ->assertOk()
            ->assertJsonPath('data.0.type', 'product')
            ->assertJsonPath('data.0.id', $product->uuid)
            ->assertJsonPath('data.0.rating_avg', '4.70')
            ->assertJsonPath('data.0.store_name', $store->name);
    }

    private function createStore(string $suffix): Store
    {
        $user = User::factory()->create();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Search Test Vendor '.$suffix,
            'business_email' => 'search-'.$suffix.'@example.test',
            'status' => 'approved',
        ]);

        return Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Search Test Store '.$suffix,
            'slug' => 'search-test-'.$suffix,
            'status' => 'active',
        ]);
    }

    private function createProduct(Store $store, string $name, string $sku, float $rating): Product
    {
        return Product::query()->create([
            'vendor_id' => $store->vendor_id,
            'store_id' => $store->id,
            'name' => $name,
            'slug' => strtolower(str_replace(' ', '-', $name)),
            'sku' => $sku,
            'status' => 'published',
            'stock_status' => 'in_stock',
            'quantity' => 10,
            'price' => 100,
            'rating_avg' => $rating,
            'rating_count' => 10,
        ]);
    }
}
