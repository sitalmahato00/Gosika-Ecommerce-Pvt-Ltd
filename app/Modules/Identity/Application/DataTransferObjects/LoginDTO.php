<?php

namespace App\Modules\Identity\Application\DataTransferObjects;

final class LoginDTO extends DataTransferObject
{
    public function __construct(
        public readonly string $identifier,
        public readonly string $password,
        public readonly ?string $device_name = null,
    ) {
    }
}
