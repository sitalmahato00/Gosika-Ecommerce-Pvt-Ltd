<?php

namespace App\Modules\Platform\Presentation\Http\Controllers;

use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class PlatformConfigController extends Controller
{
    public function publicConfig(): JsonResponse
    {
        $config = Cache::remember('platform.public_config', 60, function () {
            // Load all public settings and non-sensitive branding & general settings
            $settings = Setting::query()
                ->where(function ($q) {
                    $q->where('is_public', true)
                      ->orWhereIn('group', ['branding', 'general'])
                      ->orWhere('key', 'like', 'branding.%')
                      ->orWhere('key', 'like', 'site_%')
                      ->orWhere('key', 'like', 'logo_%')
                      ->orWhere('key', 'like', 'brand_%');
                })
                ->where('is_encrypted', false)
                ->get();

            $cfg = [];

            foreach ($settings as $setting) {
                $value = $setting->getDecryptedValue();
                data_set($cfg, $setting->key, $value);
            }

            // Canonical Brand Metadata fallbacks (Brand Orange)
            $cfg['brand_name'] = $cfg['platform_name'] ?? $cfg['site_name'] ?? $cfg['brand_name'] ?? 'GOSIKA';
            $cfg['tagline'] = $cfg['tagline'] ?? $cfg['site_tagline'] ?? "Nepal's Premier Multi-Vendor Marketplace";
            $cfg['logo_light'] = $cfg['logo_light'] ?? '';
            $cfg['logo_dark'] = $cfg['logo_dark'] ?? '';
            $cfg['favicon_url'] = $cfg['favicon_url'] ?? '';
            $cfg['primary_color'] = $cfg['primary_color'] ?? $cfg['brand_color'] ?? '#ff5500';
            $cfg['brand_color_dark'] = $cfg['brand_color_dark'] ?? '#e04b00';
            $cfg['support_email'] = $cfg['support_email'] ?? 'support@gosika.com.np';
            $cfg['support_phone'] = $cfg['support_phone'] ?? '+977-1-4200000';
            $cfg['business_address'] = $cfg['business_address'] ?? $cfg['site_address'] ?? 'Kathmandu, Nepal';
            $cfg['footer_text'] = $cfg['footer_text'] ?? '© ' . date('Y') . ' GOSIKA Pvt. Ltd. All rights reserved.';
            $cfg['currency_symbol'] = $cfg['currency_symbol'] ?? 'रु';
            $cfg['currency'] = $cfg['currency'] ?? 'NPR';
            $cfg['maintenance_mode'] = $cfg['maintenance_mode'] ?? false;
            $cfg['maintenance_message'] = $cfg['maintenance_message'] ?? '';

            // Payment status flags
            $esewaSecret = Setting::get('payment.esewa_secret_key') ?: config('services.esewa.secret_key', '');
            $cfg['payment']['esewa_enabled'] = ! empty($esewaSecret) && (Setting::get('payment.esewa_enabled') === 'true' || Setting::get('payment.esewa_enabled') === true || Setting::get('payment.esewa_enabled') === 1);

            $khaltiSecret = Setting::get('payment.khalti_secret_key') ?: config('services.khalti.secret_key', '');
            $cfg['payment']['khalti_enabled'] = ! empty($khaltiSecret) && (Setting::get('payment.khalti_enabled') === 'true' || Setting::get('payment.khalti_enabled') === true || Setting::get('payment.khalti_enabled') === 1);

            $codVal = Setting::get('checkout.cod_enabled') ?? Setting::get('payment.cod_enabled') ?? Setting::get('cod_enabled', 'true');
            $isCod = $codVal === 'true' || $codVal === true || $codVal === 1 || $codVal === '1';
            $cfg['payment']['cod_enabled'] = $isCod;
            $cfg['checkout']['cod_enabled'] = $isCod;
            $cfg['cod_enabled'] = $isCod;

            $codMax = Setting::get('checkout.cod_max_amount') ?? Setting::get('payment.cod_max_amount') ?? 100000;
            $cfg['checkout']['cod_max_amount'] = (float) $codMax;
            $cfg['payment']['cod_max_amount'] = (float) $codMax;

            return $cfg;
        });

        return Response::success($config, 'Platform configuration.');
    }

    public function socialProviders(): JsonResponse
    {
        $providers = [];

        foreach (['google'] as $provider) {
            $clientId = config("services.{$provider}.client_id");
            $providers[$provider] = ! empty($clientId) && ! str_starts_with((string) $clientId, 'your-');
        }

        return Response::success($providers, 'Available social login providers.');
    }
}
