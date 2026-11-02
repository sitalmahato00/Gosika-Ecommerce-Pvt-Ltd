<?php

namespace Tests\Feature;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Application\DataTransferObjects\KycDTO;
use App\Modules\Vendor\Application\Services\VendorOnboardingService;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Infrastructure\Models\VendorDocument;
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
        $document = VendorDocument::query()->create([
            'vendor_id' => $vendor->id,
            'document_type' => 'citizenship_front',
            'file_path' => 'vendor-documents/front.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 100,
            'status' => 'pending',
        ]);

        $kyc = app(VendorOnboardingService::class)->submitKyc($vendor, new KycDTO(
            owner_full_name: 'Vendor Owner',
            owner_citizenship_number: '12-01-76-04891',
            owner_email: 'owner@example.com',
            owner_phone: '+977 9800000000',
            business_type: null,
            address: 'Main Road',
            landmark: 'Near the market',
            province: 'Madhesh Province',
            district: 'Siraha',
            municipality: 'Golbazar Municipality',
            latitude: '26.7288',
            longitude: '85.9244',
        ));

        $this->assertSame('12-01-76-04891', $kyc->owner_citizenship_number);
        $this->assertSame('owner@example.com', $kyc->owner_email);
        $this->assertSame('+977 9800000000', $kyc->owner_phone);
        $this->assertSame('Main Road', $kyc->address);
        $this->assertSame('Madhesh Province', $kyc->province);
        $this->assertSame('Siraha', $kyc->district);
        $this->assertSame('Golbazar Municipality', $kyc->municipality);
        $this->assertSame('26.7288', $kyc->latitude);
        $this->assertSame('85.9244', $kyc->longitude);
        $this->assertSame($kyc->id, $document->fresh()->vendor_kyc_id);
        $this->assertSame(VendorStatus::UNDER_REVIEW, $vendor->fresh()->status);
    }
}
