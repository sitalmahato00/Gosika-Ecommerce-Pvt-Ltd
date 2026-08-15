<?php

namespace App\Modules\Shared\Domain\Enums;

enum DeliveryPartnerStatus: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case SUSPENDED = 'suspended';
    case INACTIVE = 'inactive';
}
