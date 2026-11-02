<?php

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Platform\Infrastructure\Models\Country;
use App\Modules\Platform\Infrastructure\Models\District;
use App\Modules\Platform\Infrastructure\Models\Municipality;
use App\Modules\Platform\Infrastructure\Models\Province;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\StoreAddress;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicMarketplaceStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_store_details_include_complete_location_and_same_site_media_urls(): void
    {
        $user = User::factory()->create();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Fruit Company',
            'business_email' => 'fruit-company@example.test',
        ]);
        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Fruits',
            'slug' => 'fruits',
            'logo' => 'stores/fruits-logo.png',
            'banner' => 'stores/fruits-banner.png',
            'description' => 'Fresh fruits from local farms.',
            'contact_email' => 'fruits@example.test',
            'contact_phone' => '9800000000',
            'status' => 'active',
        ]);

        $country = Country::query()->create(['name' => 'Nepal', 'code' => 'NP']);
        $province = Province::query()->create(['country_id' => $country->id, 'name' => 'Koshi Province']);
        $district = District::query()->create(['province_id' => $province->id, 'name' => 'Morang']);
        $municipality = Municipality::query()->create(['district_id' => $district->id, 'name' => 'Gramthan Rural Municipality']);
        StoreAddress::query()->create([
            'store_id' => $store->id,
            'address_type' => 'business',
            'address_line_1' => 'Gramthan-07, F62',
            'address_line_2' => 'Near the community market',
            'country_id' => $country->id,
            'province_id' => $province->id,
            'district_id' => $district->id,
            'municipality_id' => $municipality->id,
            'landmark' => 'Community market',
            'postal_code' => '56600',
        ]);

        $this->getJson('/api/v1/marketplace/stores/fruits')
            ->assertOk()
            ->assertJsonPath('data.logo', '/storage/stores/fruits-logo.png')
            ->assertJsonPath('data.banner', '/storage/stores/fruits-banner.png')
            ->assertJsonPath('data.address.municipality', 'Gramthan Rural Municipality')
            ->assertJsonPath('data.address.district', 'Morang')
            ->assertJsonPath('data.address.province', 'Koshi Province')
            ->assertJsonPath('data.address.landmark', 'Community market')
            ->assertJsonPath(
                'data.location',
                'Gramthan-07, F62, Gramthan Rural Municipality, Morang, Koshi Province'
            );

        $this->getJson('/api/v1/marketplace/stores')
            ->assertOk()
            ->assertJsonPath('data.0.id', $store->uuid)
            ->assertJsonPath('data.0.address.province', 'Koshi Province');
    }
}
