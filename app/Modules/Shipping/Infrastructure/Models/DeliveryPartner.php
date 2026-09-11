<?php

namespace App\Modules\Shipping\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\DeliveryPartnerStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeliveryPartner extends BaseModel
{
    use SoftDeletes;

    protected $table = 'delivery_partners';

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'email',
        'vehicle_type',
        'vehicle_number',
        'vehicle_model',
        'vehicle_color',
        'vehicle_year',
        'insurance_expiry',
        'service_areas',
        'status',
        'is_online',
        'rating_avg',
        'rating_count',
        'latitude',
        'longitude',
        'last_location_at',
        'meta',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeliveryPartnerStatus::class,
            'service_areas' => 'array',
            'is_online' => 'boolean',
            'rating_avg' => 'decimal:2',
            'rating_count' => 'integer',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'vehicle_year' => 'integer',
            'insurance_expiry' => 'date',
            'last_location_at' => 'datetime',
            'meta' => 'array',
            'approved_by' => 'integer',
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(DeliveryAssignment::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DeliveryPartnerDocument::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', DeliveryPartnerStatus::APPROVED);
    }
}
