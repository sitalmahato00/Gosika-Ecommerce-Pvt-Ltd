<?php

namespace App\Modules\Identity\Application\DataTransferObjects;

final class RegisterUserDTO extends DataTransferObject
{
    public function __construct(
        public readonly string $first_name,
        public readonly string $last_name,
        public readonly string $email,
        public readonly string $password,
        public readonly ?string $phone = null,
    ) {
    }
}
