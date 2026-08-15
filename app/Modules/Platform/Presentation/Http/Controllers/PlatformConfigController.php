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

        return Response::success($config, 'Platform configuration.');
    }
}
