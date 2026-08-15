<?php

namespace App\Modules\Shared\Infrastructure\Services;

class Money
{
    public const CURRENCY = 'NPR';

    public static function format(float|int|string $amount): string
    {
        return 'NPR '.number_format((float) $amount, 2);
    }

    public static function toPaisa(float|int|string $amount): int
    {
        return (int) round((float) $amount * 100);
    }

    public static function fromPaisa(int $paisa): float
    {
        return round($paisa / 100, 2);
    }
}
