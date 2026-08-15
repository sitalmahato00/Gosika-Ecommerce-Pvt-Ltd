<?php

namespace App\Modules\Shared\Domain\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';
    case PAYMENT_PENDING = 'payment_pending';
    case CONFIRMED = 'confirmed';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case PROCESSING = 'processing';
    case PREPARING = 'preparing';
    case READY_FOR_PICKUP = 'ready_for_pickup';
    case PICKED_UP = 'picked_up';
    case OUT_FOR_DELIVERY = 'out_for_delivery';
    case DELIVERED = 'delivered';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case RETURNED = 'returned';
    case REFUNDED = 'refunded';
    case FAILED = 'failed';
}
