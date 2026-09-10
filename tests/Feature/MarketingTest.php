<?php

namespace Tests\Feature;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Infrastructure\Models\Banner;
use App\Modules\Marketing\Infrastructure\Models\Campaign;
use App\Modules\Marketing\Infrastructure\Models\CmsPage;
use App\Modules\Marketing\Infrastructure\Models\VendorPromotion;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MarketingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
        $this->seed(\Database\Seeders\SettingsSeeder::class);
    }

    protected function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::SUPER_ADMIN);

        return $user;
    }

    protected function vendor(): Vendor
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        return Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Marketing Vendor',
            'business_email' => 'marketing@vendor.com.np',
            'status' => VendorStatus::APPROVED,
            'commission_rate' => 10,
        ]);
    }

    public function test_public_endpoints_serve_banners_campaigns_and_pages(): void
    {
        Banner::query()->create([
            'title' => 'Festive Banner',
            'image' => 'https://example.com/banner.jpg',
            'is_active' => true,
        ]);
        Banner::query()->create([
            'title' => 'Hidden Banner',
            'image' => 'https://example.com/hidden.jpg',
            'is_active' => false,
        ]);
        Campaign::query()->create([
            'title' => 'Dashain Sale',
            'type' => 'flash_sale',
            'status' => 'active',
            'start_date' => now()->subDay(),
            'end_date' => now()->addDay(),
        ]);
        Campaign::query()->create([
            'title' => 'Ended Sale',
            'type' => 'discount',
            'status' => 'ended',
            'start_date' => now()->subDays(3),
            'end_date' => now()->subDay(),
        ]);
        CmsPage::query()->create([
            'title' => 'Privacy Policy',
            'slug' => 'privacy-policy',
            'body' => '<p>Test</p>',
            'type' => 'policy',
            'status' => 'published',
        ]);
        CmsPage::query()->create([
            'title' => 'Draft Page',
            'slug' => 'draft-page',
            'body' => '<p>Draft</p>',
            'type' => 'page',
            'status' => 'draft',
        ]);

        $banners = $this->getJson('/api/v1/banners')->assertOk()->json('data');
        $this->assertCount(1, $banners);
        $this->assertSame('Festive Banner', $banners[0]['title']);

        $campaigns = $this->getJson('/api/v1/campaigns')->assertOk()->json('data');
        $this->assertCount(1, $campaigns);
        $this->assertSame('Dashain Sale', $campaigns[0]['title']);

        $pages = $this->getJson('/api/v1/pages')->assertOk()->json('data');
        $this->assertCount(1, $pages);

        $this->getJson('/api/v1/pages/privacy-policy')->assertOk()->assertJsonPath('data.slug', 'privacy-policy');
        $this->getJson('/api/v1/pages/draft-page')->assertNotFound();
    }

    public function test_admin_can_crud_campaigns(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin, 'sanctum');

        $created = $this->postJson('/api/v1/admin/campaigns', [
            'title' => 'Tihar Special',
            'tagline' => 'Shine bright',
            'type' => 'discount',
            'target_type' => 'category',
            'discount_type' => 'percentage',
            'discount_value' => 15,
            'status' => 'scheduled',
            'start_date' => now()->addDay()->toISOString(),
            'end_date' => now()->addDays(10)->toISOString(),
        ])->assertCreated()->json('data');

        $this->assertSame('Tihar Special', $created['title']);
        $this->assertSame('scheduled', $created['status']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/campaigns')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/campaigns/{$created['id']}", [
                'title' => 'Tihar Special 2079',
                'status' => 'active',
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Tihar Special 2079');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/campaigns/stats')
            ->assertOk()
            ->assertJsonPath('data.active', 1);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/campaigns/{$created['id']}")
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/campaigns')
            ->assertJsonPath('meta.pagination.total', 0);
    }

    public function test_admin_can_update_campaign_status_endpoint(): void
    {
        $admin = $this->admin();
        $campaign = Campaign::query()->create([
            'title' => 'Flash Deal',
            'type' => 'flash_sale',
            'status' => 'draft',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/campaigns/{$campaign->uuid}/status", ['status' => 'active'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/campaigns/{$campaign->uuid}/status", ['status' => 'weird'])
            ->assertStatus(422);
    }

    public function test_admin_can_manage_cms_pages(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin, 'sanctum');

        $created = $this->postJson('/api/v1/admin/pages', [
            'title' => 'Return Policy',
            'body' => '<p>7-day returns.</p>',
            'type' => 'policy',
            'status' => 'published',
        ])->assertCreated()->json('data');

        $this->assertSame('return-policy', $created['slug']);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/pages/{$created['id']}", [
                'title' => 'Return & Refund Policy',
                'status' => 'published',
            ])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/pages')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 1);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/pages/stats')
            ->assertOk()
            ->assertJsonPath('data.published', 1);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/pages/{$created['id']}")
            ->assertOk();
    }

    public function test_admin_can_oversee_vendor_promotions(): void
    {
        $admin = $this->admin();
        $vendor = $this->vendor();

        $promotion = VendorPromotion::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Pashmina Festival Deal',
            'type' => 'percentage',
            'discount_value' => 20,
            'category' => 'handicrafts',
            'status' => 'scheduled',
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(7)->toDateString(),
        ]);

        $resp = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/promotions');

        $resp->assertOk()
            ->assertJsonPath('meta.pagination.total', 1)
            ->assertJsonPath('data.0.vendor.company_name', 'Marketing Vendor');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/promotions/stats')
            ->assertOk()
            ->assertJsonPath('data.scheduled', 1);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/admin/promotions/{$promotion->uuid}/status", ['status' => 'paused'])
            ->assertOk()
            ->assertJsonPath('data.status', 'paused');

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/promotions/{$promotion->uuid}")
            ->assertOk();
    }

    public function test_marketing_admin_routes_require_auth(): void
    {
        $this->getJson('/api/v1/admin/campaigns')->assertUnauthorized();
        $this->getJson('/api/v1/admin/pages')->assertUnauthorized();
        $this->getJson('/api/v1/admin/promotions')->assertUnauthorized();
    }
}