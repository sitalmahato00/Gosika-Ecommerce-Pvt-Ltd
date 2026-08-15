<?php

namespace App\Modules\Shipping\Infrastructure\Models;

use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryTracking extends BaseModel
{
    protected $table = 'delivery_tracking';

    protected $fillable = [
        'assignment_id',
        'vendor_order_id',
        'status',
        'latitude',
        'longitude',
        'note',
        'tracked_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => DeliveryStatus::class,
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'tracked_at' => 'datetime',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(DeliveryAssignment::class, 'assignment_id');
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }
}
