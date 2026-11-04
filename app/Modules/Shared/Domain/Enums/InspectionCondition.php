<?php

namespace App\Modules\Shared\Domain\Enums;

enum InspectionCondition: string
{
    case GOOD          = 'good';
    case DAMAGED       = 'damaged';
    case DEFECTIVE     = 'defective';
    case MISSING_PARTS = 'missing_parts';

    public function label(): string
    {
        return match($this) {
            self::GOOD          => 'Good Condition',
            self::DAMAGED       => 'Damaged',
            self::DEFECTIVE     => 'Defective',
            self::MISSING_PARTS => 'Missing Parts',
        };
    }
}
