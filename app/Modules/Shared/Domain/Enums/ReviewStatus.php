<?php

namespace App\Modules\Shared\Domain\Enums;

enum ReviewStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case HIDDEN = 'hidden';
    case REJECTED = 'rejected';
}
