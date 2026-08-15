<?php

namespace App\Modules\Shared\Infrastructure\Services;

class ReferenceNumber
{
    /**
     * Generate a human-readable reference number such as ORD-000123.
     */
    public static function generate(string $prefix, ?int $sequence = null): string
    {
        $sequence ??= (int) (microtime(true) * 1000) % 1000000;

        return strtoupper($prefix).'-'.str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }

    public static function fromId(string $prefix, int $id): string
    {
        return strtoupper($prefix).'-'.str_pad((string) $id, 6, '0', STR_PAD_LEFT);
    }

    public static function unique(string $prefix, int $max = 20): string
    {
        return strtoupper($prefix).'-'.strtoupper(bin2hex(random_bytes(4)));
    }
}
