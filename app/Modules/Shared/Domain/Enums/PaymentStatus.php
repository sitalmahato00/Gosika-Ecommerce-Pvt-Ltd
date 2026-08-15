<?php

namespace App\Modules\Shared\Domain\Enums;

enum PaymentStatus: string
{
    case INITIATED = 'initiated';
    case PROCESSING = 'processing';
    case VERIFICATION = 'verification';
    case PAID = 'paid';
    case FAILED = 'failed';
    case CANCELLED = 'cancelled';
    case EXPIRED = 'expired';
    case TIMEOUT = 'timeout';
    case REFUNDED = 'refunded';
    case PARTIALLY_REFUNDED = 'partially_refunded';
    case EXCEPTION = 'exception';
}
