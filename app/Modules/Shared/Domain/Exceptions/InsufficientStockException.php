<?php

namespace App\Modules\Shared\Domain\Exceptions;

use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Contracts\Support\Responsable;

class InsufficientStockException extends DomainException implements Responsable
{
    public function __construct(string $message = 'Insufficient stock', array $errors = [])
    {
        parent::__construct($message, 409, $errors);
    }

    public function toResponse($request): \Illuminate\Http\JsonResponse
    {
        return Response::error($this->getMessage(), $this->getErrors(), $this->getStatusCode());
    }
}
