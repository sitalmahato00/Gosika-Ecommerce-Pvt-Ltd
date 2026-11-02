<?php

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Application\DataTransferObjects\KycDTO;
use App\Modules\Vendor\Application\Services\VendorOnboardingService;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class VendorKycLocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_vendor_location_is_saved_when_legacy_schema_has_no_landmark_column(): void
    {
        Schema::table('vendor_kycs', function ($table): void {
            $table->dropColumn('landmark');
        });

        $user = User::factory()->create();
        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Gosika Store',
            'business_email' => 'vendor@example.com',
            'status' => VendorStatus::PENDING,
        ]);

        $kyc = app(VendorOnboardingService::class)->submitKyc($vendor, new KycDTO(
            owner_full_name: 'Vendor Owner',
            owner_citizenship_number: null,
            owner_email: null,
            owner_phone: null,
            business_type: null,
            address: 'Main Road',
            landmark: 'Near the market',
            province: 'Madhesh Province',
            district: 'Siraha',
            municipality: 'Golbazar Municipality',
            latitude: '26.7288',
            longitude: '85.9244',
        ));

        $this->assertSame('Main Road', $kyc->address);
        $this->assertSame('Madhesh Province', $kyc->province);
        $this->assertSame('Siraha', $kyc->district);
        $this->assertSame('Golbazar Municipality', $kyc->municipality);
        $this->assertSame('26.7288', $kyc->latitude);
        $this->assertSame('85.9244', $kyc->longitude);
        $this->assertSame(VendorStatus::UNDER_REVIEW, $vendor->fresh()->status);
    }
}
