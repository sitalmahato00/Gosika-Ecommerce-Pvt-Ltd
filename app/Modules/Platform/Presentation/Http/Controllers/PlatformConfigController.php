<?php

namespace App\Modules\Platform\Presentation\Http\Controllers;

use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class PlatformConfigController extends Controller
{
    public function publicConfig(): JsonResponse
    {
        $settings = Setting::query()
            ->where('is_public', true)
            ->get();

        $config = [];

        foreach ($settings as $setting) {
            $value = $setting->value;

            if ($setting->type === 'boolean') {
                $value = $setting->value === 'true' || $setting->value === true || $setting->value === 1 || $setting->value === '1';
            } elseif ($setting->type === 'integer' || $setting->type === 'decimal') {
                $value = (float) $setting->value;
            }

            data_set($config, $setting->key, $value);
        }

        $esewaSecret = Setting::get('payment.esewa_secret_key') ?: config('services.esewa.secret_key', '');
        if (! empty($esewaSecret)) {
            data_set($config, 'payment.esewa_enabled', true);
        }

        $khaltiSecret = Setting::get('payment.khalti_secret_key') ?: config('services.khalti.secret_key', '');
        if (! empty($khaltiSecret)) {
            data_set($config, 'payment.khalti_enabled', true);
        }

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
