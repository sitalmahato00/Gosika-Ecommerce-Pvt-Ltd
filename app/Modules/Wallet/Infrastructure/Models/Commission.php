<?php

namespace App\Modules\Wallet\Infrastructure\Models;

use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\CommissionStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commission extends BaseModel
{
    protected $fillable = [
        'vendor_order_id',
        'order_id',
        'vendor_id',
        'rate',
        'basis_amount',
        'amount',
        'status',
        'calculated_at',
        'adjusted_by',
        'adjusted_at',
        'adjustment_reason',
        'reversed_at',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'basis_amount' => 'decimal:2',
            'amount' => 'decimal:2',
            'status' => CommissionStatus::class,
            'calculated_at' => 'datetime',
            'adjusted_at' => 'datetime',
            'reversed_at' => 'datetime',
        ];
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
