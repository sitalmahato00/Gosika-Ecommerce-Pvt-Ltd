<?php

namespace App\Modules\Shared\Domain\Enums;

enum ReconciliationStatus: string
{
    case MATCHED = 'matched';
    case MISMATCH = 'mismatch';
    case PENDING = 'pending';
    case EXCEPTION = 'exception';
    case RESOLVED = 'resolved';
}
