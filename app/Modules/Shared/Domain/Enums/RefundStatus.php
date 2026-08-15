<?php

namespace App\Modules\Shared\Domain\Enums;

enum RefundStatus: string
{
    case REQUESTED = 'requested';
    case APPROVED = 'approved';
    case PROCESSING = 'processing';
    case REFUNDED = 'refunded';
    case FAILED = 'failed';
    case CANCELLED = 'cancelled';
}
