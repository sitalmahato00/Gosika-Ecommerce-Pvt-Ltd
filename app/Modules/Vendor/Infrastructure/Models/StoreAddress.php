<?php

namespace App\Modules\Vendor\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreAddress extends BaseModel
{
    protected $fillable = [
        'store_id',
        'address_type',
        'address_line_1',
        'address_line_2',
        'country_id',
        'province_id',
        'district_id',
        'municipality_id',
        'postal_code',
        'landmark',
        'latitude',
        'longitude',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Platform\Infrastructure\Models\Province::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Platform\Infrastructure\Models\District::class);
    }

    public function municipality(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Platform\Infrastructure\Models\Municipality::class);
    }
}
