<?php

namespace App\Modules\Shared\Domain\Enums;

enum DeliveryStatus: string
{
    case PENDING = 'pending';
    case ASSIGNED = 'assigned';
    case ACCEPTED = 'accepted';
    case PICKED_UP = 'picked_up';
    case OUT_FOR_DELIVERY = 'out_for_delivery';
    case DELIVERED = 'delivered';
    case FAILED = 'failed';
    case RETURNED_TO_VENDOR = 'returned_to_vendor';
}
