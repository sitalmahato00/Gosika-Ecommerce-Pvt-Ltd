<?php

namespace App\Http\Controllers;

use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Http\Response;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class SpaController extends Controller
{
    /**
     * Serve the React SPA shell with server-side SEO meta tags injected.
     *
     * The built assets are extracted from public/index.html at runtime so the
     * Blade template never needs to change after a frontend rebuild.
     */
    public function __invoke(): Response
    {
        $seo = $this->resolveSeoData();
        $assets = $this->resolveAssetTags();

        return response()
            ->view('spa', compact('seo', 'assets'))
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    // ------------------------------------------------------------------ //

    private function resolveSeoData(): array
    {
        return Cache::remember('seo.spa_head_data', 120, function () {
            $rows = Setting::query()
                ->where(function ($q) {
                    $q->where('group', 'seo')
                      ->orWhere('group', 'branding')
                      ->orWhere('group', 'general');
                })
                ->where('is_encrypted', false)
                ->get(['key', 'value', 'type', 'group']);

            $data = [];
            foreach ($rows as $row) {
                $data[$row->key] = $row->getDecryptedValue();
            }

            // ── Canonical brand aliases ──────────────────────────────────────
            return [
                'brand_name'           => $data['platform_name']
                                       ?? $data['brand_name']
                                       ?? $data['site_name']
                                       ?? 'GOSIKA',
                'tagline'              => $data['tagline']
                                       ?? $data['site_tagline']
                                       ?? "Nepal's Premier Multi-Vendor Marketplace",
                'favicon_url'          => $data['favicon_url']          ?? '',
                'logo_light'           => $data['logo_light']           ?? '',
                'primary_color'        => $data['primary_color']        ?? '#ff5500',

                // SEO verification tokens
                'google_verification'  => $data['seo.google_verification']  ?? '',
                'bing_verification'    => $data['seo.bing_verification']    ?? '',
                'yandex_verification'  => $data['seo.yandex_verification']  ?? '',

                // SEO meta
                'seo_meta_description' => $data['seo_meta_description'] ?? '',
                'default_robots'       => $data['seo.default_robots']   ?? 'index,follow',
                'og_image_url'         => $data['og_image_url']         ?? '',
                'twitter_card'         => $data['seo.twitter_card']     ?? 'summary_large_image',

                // Social
                'social_facebook'      => $data['social_facebook']      ?? '',
                'social_twitter'       => $data['social_twitter']       ?? '',
                'social_instagram'     => $data['social_instagram']     ?? '',
                'social_youtube'       => $data['social_youtube']       ?? '',
            ];
        });
    }

    /**
     * Parse the built public/index.html and extract only the <script> and
     * <link> asset tags that Vite generated, so we never hardcode hashed
     * file names in the Blade template.
     */
    private function resolveAssetTags(): string
    {
        // Cache per-process so we only read the file once per request cycle.
        static $cached = null;

        if ($cached !== null) {
            return $cached;
        }

        $indexPath = public_path('index.html');

        if (! file_exists($indexPath)) {
            return '';
        }

        $html = file_get_contents($indexPath);

        // Extract everything between <head> and </head>
        if (! preg_match('/<head>(.*?)<\/head>/si', $html, $m)) {
            return '';
        }

        $head = $m[1];

        // Collect only the Vite-generated <script> and <link rel="..."> asset
        // lines (module scripts, modulepreload links, stylesheet links).
        // Exclude fonts, charset, viewport, and the <title> — we render those
        // ourselves in the Blade template.
        $lines = explode("\n", $head);
        $assetLines = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);

            // Keep Vite module scripts
            if (str_contains($trimmed, 'type="module"') && str_contains($trimmed, '/assets/')) {
                $assetLines[] = '    ' . $trimmed;
                continue;
            }

            // Keep modulepreload links
            if (str_contains($trimmed, 'rel="modulepreload"') && str_contains($trimmed, '/assets/')) {
                $assetLines[] = '    ' . $trimmed;
                continue;
            }

            // Keep stylesheet links pointing to /assets/
            if (str_contains($trimmed, 'rel="stylesheet"') && str_contains($trimmed, '/assets/')) {
                $assetLines[] = '    ' . $trimmed;
                continue;
            }
        }

        $cached = implode("\n", $assetLines);

        return $cached;
    }
}
