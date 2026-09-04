<?php

namespace App\Modules\Platform\Application\Services;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SettingsService
{
    public const CACHE_PREFIX = 'gosika_settings_';
    public const CACHE_TTL = 3600; // 1 hour

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

    private const SENSITIVE_KEYS = [
        'payment.esewa_secret_key',
        'payment.khalti_secret_key',
        'payment.khalti_public_key',
        'delivery.pathao_secret',
        'delivery.upaya_secret',
    ];

    public function __construct(
        protected ?AuditLogService $auditLogService = null
    ) {
        if (! $this->auditLogService && class_exists(AuditLogService::class)) {
            $this->auditLogService = app(AuditLogService::class);
        }
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember(self::CACHE_PREFIX . $key, self::CACHE_TTL, function () use ($key, $default) {
            return Setting::get($key, $default);
        });
    }

    public function has(string $key): bool
    {
        return Setting::where('key', $key)->exists();
    }

    public function getGroup(string $group, bool $maskSecrets = true): array
    {
        $rows = Setting::where('group', $group)->get();
        $result = [];

        foreach ($rows as $row) {
            $val = $row->getDecryptedValue();

            if ($maskSecrets && ($row->is_encrypted || in_array($row->key, self::SENSITIVE_KEYS, true))) {
                $val = ! empty($val) ? '••••••••' : '';
            }

            $result[$row->key] = $val;
        }

        return $result;
    }

    public function set(
        string $key,
        mixed $value,
        string $group = 'general',
        string $type = 'string',
        bool $isPublic = false,
        bool $isEncrypted = false,
        ?string $description = null
    ): Setting {
        $setting = Setting::set($key, $value, $group, $type, $isPublic, $isEncrypted, $description);
        Cache::forget(self::CACHE_PREFIX . $key);
        Cache::forget(self::CACHE_PREFIX . 'group_' . $group);

        return $setting;
    }

    public function updateGroup(string $group, array $values, ?User $actor = null, ?string $reason = null): array
    {
        $oldSettings = Setting::where('group', $group)->get()->keyBy('key');
        $updatedSettings = [];
        $auditOld = [];
        $auditNew = [];

        DB::transaction(function () use ($group, $values, $oldSettings, &$updatedSettings, &$auditOld, &$auditNew) {
            foreach ($values as $key => $value) {
                // If masked value passed back, keep old value
                $isSecret = in_array($key, self::SENSITIVE_KEYS, true);
                if ($isSecret && $value === '••••••••') {
                    continue;
                }

                $existing = $oldSettings->get($key);
                $oldVal = $existing ? $existing->getDecryptedValue() : null;

                // Determine type
                $type = 'string';
                if (is_bool($value)) {
                    $type = 'boolean';
                } elseif (is_int($value)) {
                    $type = 'integer';
                } elseif (is_float($value)) {
                    $type = 'decimal';
                } elseif (is_array($value)) {
                    $type = 'json';
                }

                $isEncrypted = $isSecret || ($existing && $existing->is_encrypted);

                $setting = Setting::set($key, $value, $group, $type, false, $isEncrypted);
                $updatedSettings[$key] = $value;

                Cache::forget(self::CACHE_PREFIX . $key);

                if (isset(self::ENV_SYNC_MAP[$key])) {
                    $this->syncEnv(self::ENV_SYNC_MAP[$key], is_scalar($value) ? (string) $value : '');
                }

                // Prepare audit entries (masking secrets)
                $safeOld = $isSecret && ! empty($oldVal) ? '••••••••' : $oldVal;
                $safeNew = $isSecret && ! empty($value) ? '••••••••' : $value;
                if ($safeOld !== $safeNew) {
                    $auditOld[$key] = $safeOld;
                    $auditNew[$key] = $safeNew;
                }
            }

            Cache::forget(self::CACHE_PREFIX . 'group_' . $group);
        });

        // Record Audit Log if changes occurred
        if (! empty($auditNew) && $this->auditLogService) {
            try {
                $this->auditLogService->record(
                    $actor,
                    'settings.update',
                    'SettingGroup',
                    $group,
                    $auditOld,
                    $auditNew,
                    ['group' => $group, 'reason' => $reason]
                );
            } catch (\Throwable $e) {
                Log::warning('Failed to write settings audit log: ' . $e->getMessage());
            }
        }

        return $this->getGroup($group, true);
    }

    public function clearCache(?string $group = null): void
    {
        if ($group) {
            Cache::forget(self::CACHE_PREFIX . 'group_' . $group);
            $keys = Setting::where('group', $group)->pluck('key');
            foreach ($keys as $k) {
                Cache::forget(self::CACHE_PREFIX . $k);
            }
        } else {
            $allKeys = Setting::pluck('key');
            foreach ($allKeys as $k) {
                Cache::forget(self::CACHE_PREFIX . $k);
            }
        }
    }

    protected function syncEnv(string $envKey, string $value): void
    {
        $envPath = base_path('.env');
        if (! file_exists($envPath)) {
            return;
        }

        try {
            $contents = @file_get_contents($envPath);
            if ($contents === false) {
                return;
            }

            $escaped = preg_quote($envKey, '/');
            $pattern = "/^{$escaped}=.*/m";

            if (preg_match($pattern, $contents)) {
                $contents = preg_replace($pattern, "{$envKey}={$value}", $contents);
            } else {
                $contents = rtrim($contents, "\n") . "\n{$envKey}={$value}\n";
            }

            @file_put_contents($envPath, $contents);
            $_ENV[$envKey] = $value;
            $_SERVER[$envKey] = $value;
        } catch (\Throwable $e) {
            Log::warning("ENV_SYNC failed for {$envKey}: " . $e->getMessage());
        }
    }
}
