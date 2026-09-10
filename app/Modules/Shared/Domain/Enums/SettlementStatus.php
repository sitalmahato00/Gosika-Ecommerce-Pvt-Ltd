<?php

namespace App\Modules\Shared\Domain\Enums;

enum SettlementStatus: string
{
    case ELIGIBLE = 'eligible';
    case PROCESSING = 'processing';
    case HOLD = 'hold';
    case PAID = 'paid';
}
