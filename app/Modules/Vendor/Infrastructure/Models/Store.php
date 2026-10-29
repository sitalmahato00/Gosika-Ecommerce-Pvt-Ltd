<?php

namespace App\Modules\Vendor\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends BaseModel
{
    protected $fillable = [
        'vendor_id',
        'name',
        'slug',
        'logo',
        'banner',
        'description',
        'contact_email',
        'contact_phone',
        'status',
        'rejection_reason',
        'settings',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => StoreStatus::class,
            'approved_at' => 'datetime',
            'settings' => 'array',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(StoreAddress::class);
    }

    public function operatingHours(): HasMany
    {
        return $this->hasMany(StoreOperatingHour::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(\App\Modules\Catalog\Infrastructure\Models\Product::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(\App\Modules\Marketplace\Infrastructure\Models\StoreReview::class);
    }
}
