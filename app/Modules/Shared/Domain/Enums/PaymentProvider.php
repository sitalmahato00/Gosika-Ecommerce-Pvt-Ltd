<?php

namespace App\Modules\Shared\Domain\Enums;

enum PaymentProvider: string
{
    case KHALTI = 'khalti';
    case ESEWA = 'esewa';
    case FONEPAY = 'fonepay';
    case COD = 'cod';
}
