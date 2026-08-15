<?php

namespace App\Modules\Shared\Domain\Enums;

enum PayoutStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case PROCESSING = 'processing';
    case PAID = 'paid';
    case REJECTED = 'rejected';
    case CANCELLED = 'cancelled';
}
