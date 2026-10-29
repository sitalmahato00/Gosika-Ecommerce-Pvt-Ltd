<?php

namespace App\Modules\Shipping\Infrastructure\Models;

use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DeliveryAssignment extends BaseModel
{
    protected $table = 'delivery_assignments';

    protected $fillable = [
        'vendor_order_id',
        'delivery_partner_id',
        'status',
        'delivery_fee',
        'cod_amount',
        'pickup_address',
        'dropoff_address',
        'recipient_name',
        'recipient_phone',
        'assigned_at',
        'accepted_at',
        'picked_up_at',
        'out_for_delivery_at',
        'delivered_at',
        'failed_at',
        'failure_reason',
        'proof_photo',
        'meta',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeliveryStatus::class,
            'delivery_fee' => 'decimal:2',
            'cod_amount' => 'decimal:2',
            'assigned_at' => 'datetime',
            'accepted_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'out_for_delivery_at' => 'datetime',
            'delivered_at' => 'datetime',
            'failed_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function deliveryPartner(): BelongsTo
    {
        return $this->belongsTo(DeliveryPartner::class);
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Identity\Infrastructure\Models\User::class, 'created_by');
    }

    public function tracking(): HasMany
    {
        return $this->hasMany(DeliveryTracking::class, 'assignment_id');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            DeliveryStatus::ASSIGNED,
            DeliveryStatus::ACCEPTED,
            DeliveryStatus::PICKED_UP,
            DeliveryStatus::OUT_FOR_DELIVERY,
        ]);
    }
}
