<?php

namespace App\Modules\Shared\Domain\Enums;

enum StoreStatus: string
{
    case DRAFT = 'draft';
    case PENDING_APPROVAL = 'pending_approval';
    case ACTIVE = 'active';
    case TEMPORARILY_CLOSED = 'temporarily_closed';
    case SUSPENDED = 'suspended';
    case PERMANENTLY_CLOSED = 'permanently_closed';
}
