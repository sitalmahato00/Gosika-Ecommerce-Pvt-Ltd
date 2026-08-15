<?php

namespace App\Modules\Vendor\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreOperatingHour extends BaseModel
{
    protected $fillable = [
        'store_id',
        'day_of_week',
        'opens_at',
        'closes_at',
        'is_closed',
    ];

    protected function casts(): array
    {
        return [
            'is_closed' => 'boolean',
        ];
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }
}
