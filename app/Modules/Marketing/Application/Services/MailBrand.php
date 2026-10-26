<?php

namespace App\Modules\Marketing\Application\Services;

use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Support\Facades\URL;

class MailBrand
{
    public static function all(): array
    {
        $appUrl = rtrim((string) config('app.url'), '/');
        $frontendUrl = rtrim((string) (config('app.frontend_url') ?: config('app.url')), '/');

        $brandName = (string) (Setting::get('brand_name') ?: Setting::get('site_name') ?: config('app.name', 'GOSIKA'));
        $primary = (string) (Setting::get('primary_color') ?: Setting::get('brand_color') ?: '#ff5500');
        $dark = (string) (Setting::get('brand_color_dark') ?: '#e04b00');

        // Retired colour schemes fall back to the canonical brand orange.
        if (in_array(strtolower($primary), ['#6366f1', '#ff006f'], true)) {
            $primary = '#ff5500';
        }
        if (strtolower($dark) === '#4338ca') {
            $dark = '#e04b00';
        }
        $logo = (string) (Setting::get('logo_light') ?: Setting::get('logo_dark') ?: '');

        return [
            'app_name' => (string) config('app.name', 'GOSIKA'),
            'brand_name' => $brandName,
            'email_header' => (string) (Setting::get('email_header') ?: $brandName.' Marketplace Notifications'),
            'brand_primary' => $primary,
            'brand_dark' => $dark,
            'logo_url' => $logo === '' ? '' : (str_starts_with($logo, 'http') ? $logo : $appUrl.'/storage/'.ltrim($logo, '/')),
            'support_email' => (string) (Setting::get('support_email') ?: 'support@gosika.com.np'),
            'support_phone' => (string) (Setting::get('support_phone') ?: '+977-1-4200000'),
            'currency' => (string) (Setting::get('currency') ?: 'NPR'),
            'currency_symbol' => (string) (Setting::get('currency_symbol') ?: 'रु'),
            'app_url' => $appUrl,
            'frontend_url' => $frontendUrl,
        ];
    }

    public static function money(float|int|string $amount): string
    {
        $symbol = (string) (Setting::get('currency_symbol') ?: 'रु');

        return $symbol.' '.number_format((float) $amount, 2);
    }

    public static function url(string $path): string
    {
        $frontendUrl = rtrim((string) (config('app.frontend_url') ?: config('app.url')), '/');

        return $frontendUrl.'/'.ltrim($path, '/');
    }

    public static function absolute(string $path): string
    {
        if ($path === '' || str_starts_with($path, 'http') || str_starts_with($path, 'data:')) {
            return $path;
        }

        $appUrl = rtrim((string) config('app.url'), '/');

        return str_starts_with($path, '/storage/')
            ? $appUrl.$path
            : $appUrl.'/storage/'.ltrim($path, '/');
    }
}