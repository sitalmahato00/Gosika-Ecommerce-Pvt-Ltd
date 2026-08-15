<?php

namespace App\Modules\Payment\Domain\Contracts;

interface PaymentProviderContract
{
    public function name(): string;

    public function initiate(array $payload): array;

    public function lookup(string $reference, ?array $params = null): array;
}
