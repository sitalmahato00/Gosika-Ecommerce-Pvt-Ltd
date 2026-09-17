<?php

namespace App\Modules\Vendor\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\KycStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorKyc extends BaseModel
{
    protected $fillable = [
        'vendor_id',
        'owner_full_name',
        'owner_citizenship_number',
        'owner_email',
        'owner_phone',
        'business_type',
        'address',
        'province',
        'district',
        'municipality',
        'latitude',
        'longitude',
        'status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => KycStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(VendorDocument::class);
    }
}
