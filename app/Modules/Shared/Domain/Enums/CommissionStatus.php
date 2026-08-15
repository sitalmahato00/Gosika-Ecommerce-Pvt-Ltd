<?php

namespace App\Modules\Shared\Domain\Enums;

enum CommissionStatus: string
{
    case CALCULATED = 'calculated';
    case PENDING = 'pending';
    case EARNED = 'earned';
    case ADJUSTED = 'adjusted';
    case REVERSED = 'reversed';
}
