<?php

namespace App\Modules\Shared\Domain\Enums;

enum VendorStatus: string
{
    case PENDING = 'pending';
    case UNDER_REVIEW = 'under_review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case SUSPENDED = 'suspended';
    case INACTIVE = 'inactive';
}
