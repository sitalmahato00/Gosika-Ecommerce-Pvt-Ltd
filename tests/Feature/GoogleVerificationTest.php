<?php

namespace Tests\Feature;

use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Feature tests for Google Search Console HTML-tag ownership verification.
 *
 * These tests confirm that:
 *  - A saved google_verification token appears in the server-rendered <head>.
 *  - The exact token value matches what was saved.
 *  - The tag is inside <head>, not <body>.
 *  - No tag is rendered when the token is empty.
 *  - The token is never hardcoded (we supply our own test value).
 *  - Saving via the admin API persists the token to the database.
 *  - The admin SEO endpoint is protected (unauthenticated callers get 401).
 *  - The public homepage never contains duplicate google-site-verification tags.
 */
class GoogleVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure the cache is clean for each test so we always read from DB.
        Cache::flush();
    }

    // ── 1. Token appears in the server-rendered <head> ────────────────────

    public function test_homepage_contains_google_verification_meta_tag_when_token_is_set(): void
    {
        Setting::set('seo.google_verification', 'test-google-token-abc123', 'seo');
        Cache::flush();

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertSee(
            '<meta name="google-site-verification" content="test-google-token-abc123"',
            escape: false
        );
    }

    // ── 2. Exact content attribute value matches saved token ──────────────

    public function test_google_verification_content_exactly_matches_saved_token(): void
    {
        $token = 'ExactToken_XYZ_9876';
        Setting::set('seo.google_verification', $token, 'seo');
        Cache::flush();

        $body = $this->get('/')->getContent();

        $this->assertStringContainsString(
            'content="' . $token . '"',
            $body,
            'The content attribute should exactly match the saved token.'
        );
    }

    // ── 3. Tag appears inside <head>, not <body> ──────────────────────────

    public function test_google_verification_tag_is_inside_head_not_body(): void
    {
        Setting::set('seo.google_verification', 'head-check-token', 'seo');
        Cache::flush();

        $body = $this->get('/')->getContent();

        // Find positions of <head>, </head>, and the meta tag
        $headOpen  = strpos($body, '<head>');
        $headClose = strpos($body, '</head>');
        $metaPos   = strpos($body, 'google-site-verification');

        $this->assertNotFalse($headOpen,  '<head> must exist in the response.');
        $this->assertNotFalse($headClose, '</head> must exist in the response.');
        $this->assertNotFalse($metaPos,   'google-site-verification must exist in the response.');

        $this->assertGreaterThan($headOpen, $metaPos,   'meta tag must come after <head>.');
        $this->assertLessThan($headClose,   $metaPos,   'meta tag must come before </head>.');
    }

    // ── 4. Token is not hardcoded ─────────────────────────────────────────

    public function test_verification_tag_uses_dynamic_token_not_hardcoded(): void
    {
        $uniqueToken = 'DynamicToken_' . uniqid();
        Setting::set('seo.google_verification', $uniqueToken, 'seo');
        Cache::flush();

        $body = $this->get('/')->getContent();

        $this->assertStringContainsString(
            'content="' . $uniqueToken . '"',
            $body,
            'The tag must use the dynamically stored token, not a hardcoded value.'
        );
    }

    // ── 5. No tag rendered when token is empty ────────────────────────────

    public function test_homepage_loads_without_verification_tag_when_token_is_empty(): void
    {
        // Ensure the key either does not exist or is empty
        Setting::set('seo.google_verification', '', 'seo');
        Cache::flush();

        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertDontSee('google-site-verification', escape: false);
    }

    public function test_homepage_loads_normally_when_no_verification_setting_exists(): void
    {
        // Do not set the key at all
        Cache::flush();

        $response = $this->get('/');

        $response->assertStatus(200);
        // No tag should appear — just make sure the page loads
        $this->assertStringNotContainsString(
            'name="google-site-verification"',
            $response->getContent()
        );
    }

    // ── 6. Admin API save persists the token ─────────────────────────────

    public function test_saving_seo_settings_persists_google_verification_token(): void
    {
        // Create and authenticate a super_admin user
        $user = $this->createAdminUser();
        $token = $user->createToken('test')->plainTextToken;

        $newToken = 'SavedViaApi_' . uniqid();

        $response = $this->withToken($token)
            ->putJson('/api/v1/admin/seo/settings', [
                'seo.google_verification' => $newToken,
            ]);

        $response->assertStatus(200);

        // Verify persisted to DB
        $stored = Setting::get('seo.google_verification');
        $this->assertSame($newToken, $stored, 'Token must be persisted in the settings table.');
    }

    // ── 7. Admin SEO endpoint is protected ────────────────────────────────

    public function test_admin_seo_settings_endpoint_requires_authentication(): void
    {
        $response = $this->putJson('/api/v1/admin/seo/settings', [
            'seo.google_verification' => 'unauthenticated',
        ]);

        $response->assertStatus(401);
    }

    public function test_admin_seo_settings_get_requires_authentication(): void
    {
        $response = $this->getJson('/api/v1/admin/seo/settings');

        $response->assertStatus(401);
    }

    // ── 8. No duplicate google-site-verification tags ─────────────────────

    public function test_homepage_does_not_contain_duplicate_google_verification_tags(): void
    {
        Setting::set('seo.google_verification', 'no-dupe-token', 'seo');
        Cache::flush();

        $body = $this->get('/')->getContent();

        $occurrences = substr_count($body, 'google-site-verification');

        $this->assertSame(
            1,
            $occurrences,
            'There should be exactly one google-site-verification occurrence in the HTML.'
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function createAdminUser(): \App\Modules\Identity\Infrastructure\Models\User
    {
        $user = \App\Modules\Identity\Infrastructure\Models\User::factory()->create([
            'email' => 'testadmin@gosika.test',
        ]);

        // Use the 'web' guard in tests (Sanctum uses 'web' guard for token auth in tests)
        $role = \Spatie\Permission\Models\Role::firstOrCreate(
            ['name' => 'super_admin', 'guard_name' => 'web']
        );

        $user->assignRole($role);

        return $user;
    }
}
