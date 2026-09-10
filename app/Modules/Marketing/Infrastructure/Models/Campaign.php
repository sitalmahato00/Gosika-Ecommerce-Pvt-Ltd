<?php

namespace App\Modules\Marketing\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campaign extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'tagline',
        'description',
        'image',
        'type',
        'target_type',
        'target_ids',
        'discount_type',
        'discount_value',
        'min_order_amount',
        'status',
        'sort_order',
        'created_by',
        'start_date',
        'end_date',
    ];

    protected function casts(): array
    {
        return [
            'target_ids' => 'array',
            'discount_value' => 'decimal:2',
            'min_order_amount' => 'decimal:2',
            'sort_order' => 'integer',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }
}