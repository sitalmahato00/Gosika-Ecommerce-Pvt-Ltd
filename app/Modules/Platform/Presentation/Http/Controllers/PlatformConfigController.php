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
            ->get()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value]);

        return Response::success($settings, 'Platform configuration.');
    }
}
