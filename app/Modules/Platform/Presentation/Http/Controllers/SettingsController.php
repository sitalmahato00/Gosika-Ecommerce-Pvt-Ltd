<?php

namespace App\Modules\Platform\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Artisan;

class SettingsController extends Controller
{
    private const ENV_SYNC_MAP = [
        'payment.esewa_secret_key'    => 'ESEWA_SECRET_KEY',
        'payment.esewa_product_code'  => 'ESEWA_PRODUCT_CODE',
        'payment.esewa_environment'   => 'ESEWA_ENVIRONMENT',
        'payment.esewa_base_url'      => 'ESEWA_BASE_URL',
        'payment.khalti_secret_key'   => 'KHALTI_SECRET_KEY',
        'payment.khalti_public_key'   => 'KHALTI_PUBLIC_KEY',
        'payment.khalti_environment'  => 'KHALTI_ENVIRONMENT',
        'payment.khalti_base_url'     => 'KHALTI_BASE_URL',
    ];

    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
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

        if (isset(self::ENV_SYNC_MAP[$key])) {
            $this->syncEnv(self::ENV_SYNC_MAP[$key], $validated['value'] ?? '');
        }

        return Response::success($setting, 'Setting updated.');
    }

    public function destroy(string $key): JsonResponse
    {
        $deleted = Setting::where('key', $key)->delete();

        if (! $deleted) {
            return Response::error('Setting not found.', 404);
        }

        if (isset(self::ENV_SYNC_MAP[$key])) {
            $this->syncEnv(self::ENV_SYNC_MAP[$key], '');
        }

        return Response::success(null, 'Setting deleted.');
    }

    private function syncEnv(string $envKey, string $value): void
    {
        $envPath = base_path('.env');

        if (! file_exists($envPath)) {
            \Log::warning('ENV_SYNC: .env file not found', ['key' => $envKey]);

            return;
        }

        $contents = file_get_contents($envPath);

        if ($contents === false) {
            \Log::warning('ENV_SYNC: failed to read .env', ['key' => $envKey]);

            return;
        }

        $escaped = preg_quote($envKey, '/');
        $pattern = "/^{$escaped}=.*/m";

        if (preg_match($pattern, $contents)) {
            $contents = preg_replace($pattern, "{$envKey}={$value}", $contents);
        } else {
            $contents = rtrim($contents, "\n")."\n{$envKey}={$value}\n";
        }

        $written = file_put_contents($envPath, $contents);

        if ($written === false) {
            \Log::error('ENV_SYNC: failed to write .env', ['key' => $envKey, 'env_path' => $envPath]);

            return;
        }

        $_ENV[$envKey] = $value;
        $_SERVER[$envKey] = $value;

        Artisan::call('config:clear');

        \Log::info('ENV_SYNC: updated', ['env_key' => $envKey, 'value' => $value !== '' ? '(set)' : '(empty)']);
    }
}
