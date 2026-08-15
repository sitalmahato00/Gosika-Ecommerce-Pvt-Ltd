<?php

namespace App\Modules\Shared\Domain\Enums;

enum DiscountType: string
{
    case NONE = 'none';
    case FIXED = 'fixed';
    case PERCENTAGE = 'percentage';
    case FREE_SHIPPING = 'free_shipping';
}
