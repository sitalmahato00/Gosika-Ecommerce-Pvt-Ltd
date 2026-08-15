<?php

namespace Tests\Feature;

use App\Modules\Platform\Infrastructure\Models\Country;
use App\Modules\Platform\Infrastructure\Models\Province;
use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_config_returns_only_public_settings(): void
    {
        Setting::set('commission.default_rate', '10', 'commission', 'decimal', true);
        Setting::set('internal.secret', 'hidden', 'internal', 'string', false);

        $this->getJson('/api/v1/platform/config')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJson([
                'data' => [
                    'commission.default_rate' => '10',
                ],
            ])
            ->assertJsonMissingPath('data.internal.secret');
    }

    public function test_provinces_are_listed(): void
    {
        $country = Country::query()->create([
            'name' => 'Nepal',
            'code' => 'NP',
            'phone_code' => '+977',
            'is_active' => true,
        ]);

        Province::query()->create([
            'country_id' => $country->id,
            'name' => 'Koshi Province',
            'code' => 'P1',
            'is_active' => true,
        ]);

        $this->getJson('/api/v1/platform/provinces')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Koshi Province');
    }

    public function test_settings_require_permission(): void
    {
        $this->getJson('/api/v1/admin/settings')
            ->assertStatus(401);
    }
}
