<?php

namespace App\Modules\Shipping\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShippingZone extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'provinces',
        'standard_charge',
        'express_charge',
        'estimated_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'provinces' => 'array',
            'standard_charge' => 'decimal:2',
            'express_charge' => 'decimal:2',
            'estimated_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
