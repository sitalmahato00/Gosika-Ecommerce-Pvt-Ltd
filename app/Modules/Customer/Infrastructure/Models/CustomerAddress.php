<?php

namespace App\Modules\Customer\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Platform\Infrastructure\Models\Country;
use App\Modules\Platform\Infrastructure\Models\District;
use App\Modules\Platform\Infrastructure\Models\Municipality;
use App\Modules\Platform\Infrastructure\Models\Province;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerAddress extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'address_type',
        'label',
        'full_name',
        'phone',
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
        'is_default',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }

    public function municipality(): BelongsTo
    {
        return $this->belongsTo(Municipality::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
