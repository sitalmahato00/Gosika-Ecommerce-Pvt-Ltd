<?php

namespace App\Modules\Shared\Domain\Enums;

enum KycStatus: string
{
    case DRAFT = 'draft';
    case SUBMITTED = 'submitted';
    case UNDER_REVIEW = 'under_review';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case RESUBMISSION_REQUIRED = 'resubmission_required';
}
