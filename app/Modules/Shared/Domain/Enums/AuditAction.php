<?php

namespace App\Modules\Shared\Domain\Enums;

enum AuditAction: string
{
    case CREATE = 'create';
    case UPDATE = 'update';
    case DELETE = 'delete';
    case APPROVE = 'approve';
    case REJECT = 'reject';
    case STATUS_CHANGE = 'status_change';
    case LOGIN = 'login';
    case LOGOUT = 'logout';
    case PAYMENT = 'payment';
    case REFUND = 'refund';
    case SETTLEMENT = 'settlement';
    case ROLE_CHANGE = 'role_change';
    case PERMISSION_CHANGE = 'permission_change';
    case CONFIGURATION_CHANGE = 'configuration_change';
}
