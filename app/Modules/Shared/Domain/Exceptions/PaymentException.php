<?php

namespace App\Modules\Shared\Domain\Exceptions;

use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Contracts\Support\Responsable;

class PaymentException extends DomainException implements Responsable
{
    public function toResponse($request): \Illuminate\Http\JsonResponse
    {
        return Response::error($this->getMessage(), $this->getErrors(), $this->getStatusCode());
    }
}
