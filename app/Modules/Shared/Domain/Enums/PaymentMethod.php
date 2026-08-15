<?php

namespace App\Modules\Shared\Domain\Enums;

enum PaymentMethod: string
{
    case KHALTI = 'khalti';
    case ESEWA = 'esewa';
    case FONEPAY = 'fonepay';
    case COD = 'cod';
}
