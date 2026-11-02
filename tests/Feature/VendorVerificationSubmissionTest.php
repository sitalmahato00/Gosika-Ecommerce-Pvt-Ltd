<?php

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Platform\Infrastructure\Models\Country;
use App\Modules\Platform\Infrastructure\Models\District;
use App\Modules\Platform\Infrastructure\Models\Municipality;
use App\Modules\Platform\Infrastructure\Models\Province;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Infrastructure\Models\VendorDocument;
use App\Modules\Vendor\Infrastructure\Models\VendorKyc;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class VendorVerificationSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_verification_form_saves_all_sections_and_documents(): void
    {
        Storage::fake('local');
        Storage::fake('public');

        $user = User::factory()->create();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Original Business',
            'business_email' => 'original@example.com',
        ]);

        $country = Country::query()->create(['name' => 'Nepal', 'code' => 'NP']);
        $province = Province::query()->create(['country_id' => $country->id, 'name' => 'Madhesh Province']);
        $district = District::query()->create(['province_id' => $province->id, 'name' => 'Siraha']);
        $municipality = Municipality::query()->create(['district_id' => $district->id, 'name' => 'Golbazar Municipality']);

        $this->actingAs($user);

        $logo = $this->post('/api/v1/upload/image', [
            'folder' => 'stores',
            'image' => $this->fakePng('logo.png'),
        ])->assertOk()->json('data.url');

        $banner = $this->post('/api/v1/upload/image', [
            'folder' => 'stores',
            'image' => $this->fakePng('banner.png'),
        ])->assertOk()->json('data.url');

        foreach (['citizenship_front', 'citizenship_back', 'pan_vat', 'business_registration'] as $type) {
            $this->post('/api/v1/vendor/documents', [
                'document_type' => $type,
                'file' => $this->fakePng($type.'.png'),
            ])->assertCreated();
        }

        $payload = [
            'first_name' => 'Updated',
            'last_name' => 'Owner',
            'phone' => $user->phone,
            'company_name' => 'Updated Business',
            'business_email' => 'business@example.com',
            'business_phone' => '+9779800000000',
            'pan_vat' => '609842103',
            'registration_number' => 'REG-2026-001',
            'store_name' => 'Updated Store',
            'store_description' => 'Store description from the form',
            'store_logo' => $logo,
            'store_banner' => $banner,
            'bank_name' => 'Nabil Bank',
            'branch_name' => 'Kathmandu',
            'account_name' => 'Updated Owner',
            'account_number' => '123456789',
            'account_type' => 'savings',
            'owner_full_name' => 'Updated Owner',
            'owner_citizenship_number' => '12-01-76-04891',
            'owner_email' => 'owner@example.com',
            'owner_phone' => '+9779800000000',
            'business_type' => 'Private Limited (Pvt. Ltd.)',
            'address' => 'Main Road',
            'landmark' => 'Near the market',
            'province' => 'Madhesh Province',
            'district' => 'Siraha',
            'municipality' => 'Golbazar Municipality',
            'latitude' => '26.7288',
            'longitude' => '85.9244',
        ];

        $this->postJson('/api/v1/vendor/verification/submit', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Vendor verification saved and submitted for review.');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'first_name' => 'Updated',
            'last_name' => 'Owner',
        ]);
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'company_name' => 'Updated Business',
            'pan_vat' => '609842103',
            'registration_number' => 'REG-2026-001',
        ]);
        $this->assertDatabaseHas('stores', [
            'vendor_id' => $vendor->id,
            'name' => 'Updated Store',
            'description' => 'Store description from the form',
        ]);
        $this->assertDatabaseHas('bank_accounts', [
            'vendor_id' => $vendor->id,
            'account_number' => '123456789',
        ]);
        $this->assertDatabaseHas('vendor_kycs', [
            'vendor_id' => $vendor->id,
            'owner_citizenship_number' => '12-01-76-04891',
            'address' => 'Main Road',
            'district' => 'Siraha',
        ]);
        $this->assertDatabaseHas('store_addresses', [
            'store_id' => Store::query()->where('vendor_id', $vendor->id)->value('id'),
            'address_type' => 'business',
            'address_line_1' => 'Main Road',
            'address_line_2' => 'Golbazar Municipality, Siraha, Madhesh Province',
            'country_id' => $country->id,
            'province_id' => $province->id,
            'district_id' => $district->id,
            'municipality_id' => $municipality->id,
            'landmark' => 'Near the market',
            'latitude' => '26.7288',
            'longitude' => '85.9244',
        ]);

        $this->assertSame(4, VendorDocument::query()->where('vendor_id', $vendor->id)->count());
        $this->assertSame(4, VendorDocument::query()->whereNotNull('vendor_kyc_id')->count());
        $this->assertSame('Updated Store', Store::query()->where('vendor_id', $vendor->id)->firstOrFail()->name);
        $this->assertSame('Nabil Bank', BankAccount::query()->where('vendor_id', $vendor->id)->firstOrFail()->bank_name);
        $this->assertSame('26.7288', VendorKyc::query()->where('vendor_id', $vendor->id)->firstOrFail()->latitude);

        $savedVendor = $this->getJson('/api/v1/vendor/me')->assertOk()->json('data');
        $this->assertSame('Near the market', $savedVendor['stores'][0]['addresses'][0]['landmark']);
        $payload['store_id'] = $savedVendor['stores'][0]['id'];
        $payload['bank_account_id'] = $savedVendor['bank_accounts'][0]['id'];
        $payload['store_description'] = 'Updated store description';
        $payload['account_number'] = '987654321';

        $this->postJson('/api/v1/vendor/verification/submit', $payload)->assertOk();

        $this->assertSame(1, Store::query()->where('vendor_id', $vendor->id)->count());
        $this->assertSame(1, BankAccount::query()->where('vendor_id', $vendor->id)->count());
        $this->assertDatabaseHas('stores', [
            'vendor_id' => $vendor->id,
            'description' => 'Updated store description',
        ]);
        $this->assertDatabaseHas('bank_accounts', [
            'vendor_id' => $vendor->id,
            'account_number' => '987654321',
        ]);
    }

    private function fakePng(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lfoAAAAASUVORK5CYII=')
        );
    }
}
