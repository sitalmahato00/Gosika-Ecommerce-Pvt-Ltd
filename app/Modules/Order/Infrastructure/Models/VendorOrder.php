<?php

namespace App\Modules\Order\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class VendorOrder extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'vendor_order_number',
        'order_id',
        'vendor_id',
        'store_id',
        'status',
        'delivery_status',
        'items_subtotal',
        'discount',
        'delivery_charge',
        'tax',
        'grand_total',
        'commission_rate',
        'commission_amount',
        'vendor_payable',
        'delivery_partner_name',
        'meta',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'delivery_status' => DeliveryStatus::class,
            'items_subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'delivery_charge' => 'decimal:2',
            'tax' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'vendor_payable' => 'decimal:2',
            'meta' => 'array',
            'deleted_by' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(\App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment::class)->latest('id');
    }
}
