<?php

namespace App\Modules\Shared\Domain\Enums;

enum SettlementStatus: string
{
    case PENDING = 'pending';
    case ELIGIBLE = 'eligible';
    case PROCESSING = 'processing';
    case PAID = 'paid';
    case FAILED = 'failed';
    case ON_HOLD = 'on_hold';
    case REVERSED = 'reversed';
}
