<?php

namespace App\Modules\Shared\Domain\Enums;

enum ReturnRequestType: string
{
    case RETURN_REFUND  = 'return_refund';   // Customer wants product returned + money back
    case EXCHANGE       = 'exchange';        // Customer wants a different product
    case REPLACEMENT    = 'replacement';     // Damaged / defective — same product replacement

    public function label(): string
    {
        return match($this) {
            self::RETURN_REFUND => 'Return & Refund',
            self::EXCHANGE      => 'Exchange for Another Product',
            self::REPLACEMENT   => 'Replacement (Damaged / Defective)',
        };
    }
}
