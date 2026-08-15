<?php

namespace App\Modules\Order\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnRequest extends BaseModel
{
    protected $fillable = [
        'return_number',
        'user_id',
        'order_id',
        'vendor_order_id',
        'order_item_id',
        'store_id',
        'vendor_id',
        'reason_type',
        'reason',
        'quantity',
        'refund_amount',
        'status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
        'window_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReturnStatus::class,
            'refund_amount' => 'decimal:2',
            'quantity' => 'integer',
            'reviewed_at' => 'datetime',
            'window_expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
