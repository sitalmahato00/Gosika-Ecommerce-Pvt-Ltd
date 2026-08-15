<?php

namespace App\Modules\Platform\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class SettingsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('permission:'.Permissions::SETTINGS_MANAGE);
    }

    public function index(): JsonResponse
    {
        $settings = Setting::query()
            ->orderBy('group')
            ->orderBy('key')
            ->get();

        return Response::success($settings, 'Settings retrieved.');
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => ['nullable'],
            'group' => ['nullable', 'string', 'max:80'],
            'type' => ['nullable', 'string', 'in:string,integer,boolean,decimal,json'],
            'is_public' => ['nullable', 'boolean'],
        ]);

        $setting = Setting::updateOrCreate(['key' => $key], [
            'value' => $validated['value'] ?? null,
            'group' => $validated['group'] ?? 'general',
            'type' => $validated['type'] ?? 'string',
            'is_public' => $validated['is_public'] ?? false,
        ]);

        return Response::success($setting, 'Setting updated.');
    }
}
