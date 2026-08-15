<?php

namespace App\Modules\Shared\Domain\Enums;

enum ReturnStatus: string
{
    case REQUESTED = 'requested';
    case UNDER_REVIEW = 'under_review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case COLLECTED = 'collected';
    case INSPECTED = 'inspected';
    case REFUND_PENDING = 'refund_pending';
    case REFUNDED = 'refunded';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
}
