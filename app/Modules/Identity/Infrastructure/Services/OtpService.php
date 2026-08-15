<?php

namespace App\Modules\Identity\Infrastructure\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class OtpService
{
    private const TTL_SECONDS = 600; // 10 minutes
    private const MAX_ATTEMPTS = 5;

    public function generate(string $phone): string
    {
        $code = (string) random_int(100000, 999999);

        Cache::put($this->hashKey($phone), [
            'code' => hash('sha256', $code),
            'attempts' => 0,
        ], self::TTL_SECONDS);

        return $code;
    }

    public function verify(string $phone, string $code): bool
    {
        $key = $this->hashKey($phone);
        $entry = Cache::get($key);

        if (! $entry) {
            return false;
        }

        if (($entry['attempts'] ?? 0) >= self::MAX_ATTEMPTS) {
            Cache::forget($key);

            return false;
        }

        if (hash_equals($entry['code'], hash('sha256', $code))) {
            Cache::forget($key);

            return true;
        }

        $entry['attempts'] = ($entry['attempts'] ?? 0) + 1;
        Cache::put($key, $entry, self::TTL_SECONDS);

        return false;
    }

    private function hashKey(string $phone): string
    {
        return 'otp:'.hash('sha256', Str::lower(trim($phone)));
    }
}
