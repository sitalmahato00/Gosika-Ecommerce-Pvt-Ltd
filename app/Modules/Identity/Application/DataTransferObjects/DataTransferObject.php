<?php

namespace App\Modules\Identity\Application\DataTransferObjects;

abstract class DataTransferObject
{
    public static function fromArray(array $data): static
    {
        return new static(...array_filter($data, fn ($value) => $value !== null));
    }
}
