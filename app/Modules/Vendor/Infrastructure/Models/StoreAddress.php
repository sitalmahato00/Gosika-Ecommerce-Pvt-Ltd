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
}
