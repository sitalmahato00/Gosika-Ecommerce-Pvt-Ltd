<?php

namespace App\Modules\Shared\Domain\Exceptions;

use Exception;

class DomainException extends Exception
{
    public function __construct(
        string $message,
        protected int $statusCode = 422,
        protected array $errors = []
    ) {
        parent::__construct($message);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
