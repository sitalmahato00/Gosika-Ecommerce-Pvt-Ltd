<?php

namespace App\Modules\Shared\Domain\Enums;

enum UserStatus: string
{
    case PENDING = 'pending';
    case ACTIVE = 'active';
    case SUSPENDED = 'suspended';
    case BLOCKED = 'blocked';
}
