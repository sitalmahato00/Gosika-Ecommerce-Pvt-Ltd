<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ $seo['brand_name'] ?? 'GOSIKA' }} — {{ $seo['tagline'] ?? "Nepal's Premier Multi-Vendor Marketplace" }}</title>

    @if (!empty($seo['favicon_url']))
    <link rel="icon" href="{{ $seo['favicon_url'] }}" />
    @endif

    {{-- ── Google Search Console ownership verification ───────────────── --}}
    @if (!empty($seo['google_verification']))
    <meta name="google-site-verification" content="{{ $seo['google_verification'] }}" />
    @endif

    {{-- ── Bing / Microsoft Webmaster Tools verification ──────────────── --}}
    @if (!empty($seo['bing_verification']))
    <meta name="msvalidate.01" content="{{ $seo['bing_verification'] }}" />
    @endif

    {{-- ── Yandex Webmaster verification ──────────────────────────────── --}}
    @if (!empty($seo['yandex_verification']))
    <meta name="yandex-verification" content="{{ $seo['yandex_verification'] }}" />
    @endif

    {{-- ── Default SEO meta ────────────────────────────────────────────── --}}
    @if (!empty($seo['seo_meta_description']))
    <meta name="description" content="{{ $seo['seo_meta_description'] }}" />
    @endif
    <meta name="robots" content="{{ $seo['default_robots'] ?? 'index,follow' }}" />

    {{-- ── Open Graph ──────────────────────────────────────────────────── --}}
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="{{ $seo['brand_name'] ?? 'GOSIKA' }}" />
    <meta property="og:title" content="{{ $seo['brand_name'] ?? 'GOSIKA' }}" />
    @if (!empty($seo['seo_meta_description']))
    <meta property="og:description" content="{{ $seo['seo_meta_description'] }}" />
    @endif
    @if (!empty($seo['og_image_url']))
    <meta property="og:image" content="{{ $seo['og_image_url'] }}" />
    @endif

    {{-- ── Twitter / X Card ────────────────────────────────────────────── --}}
    <meta name="twitter:card" content="{{ $seo['twitter_card'] ?? 'summary_large_image' }}" />
    <meta name="twitter:title" content="{{ $seo['brand_name'] ?? 'GOSIKA' }}" />
    @if (!empty($seo['seo_meta_description']))
    <meta name="twitter:description" content="{{ $seo['seo_meta_description'] }}" />
    @endif
    @if (!empty($seo['og_image_url']))
    <meta name="twitter:image" content="{{ $seo['og_image_url'] }}" />
    @endif

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
    />

    {{-- ── Built React SPA assets (parsed from public/index.html) ─────── --}}
    {!! $assets !!}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
