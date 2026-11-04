<?php

namespace App\Modules\Order\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Payment\Infrastructure\Models\Refund;
use App\Modules\Shared\Domain\Enums\InspectionCondition;
use App\Modules\Shared\Domain\Enums\ReturnRequestType;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        // Request details
        'request_type',
        'reason_type',
        'reason',
        'quantity',
        'refund_amount',
        'preferred_resolution',
        // Status
        'status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
        'window_expires_at',
        // Return logistics
        'return_method',
        'pickup_instructions',
        'pickup_collected_at',
        'pickup_collected_by',
        // Inspection
        'inspection_condition',
        'inspection_notes',
        'inspection_photos',
        'inspected_at',
        'inspected_by',
        // Resolution tracking
        'exchange_order_id',
        'exchange_dispatched_at',
        'replacement_dispatched_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'status'               => ReturnStatus::class,
            'request_type'         => ReturnRequestType::class,
            'inspection_condition' => InspectionCondition::class,
            'inspection_photos'    => 'array',
            'refund_amount'        => 'decimal:2',
            'quantity'             => 'integer',
            'reviewed_at'          => 'datetime',
            'window_expires_at'    => 'datetime',
            'pickup_collected_at'  => 'datetime',
            'inspected_at'         => 'datetime',
            'exchange_dispatched_at'    => 'datetime',
            'replacement_dispatched_at' => 'datetime',
            'closed_at'            => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

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

    public function inspectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspected_by');
    }

    public function pickupCollectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pickup_collected_by');
    }

    public function exchangeOrder(): BelongsTo
    {
        return $this->belongsTo(Order::class, 'exchange_order_id');
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(ReturnRequestMedia::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(ReturnStatusHistory::class)->orderBy('created_at');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function isExchange(): bool
    {
        return $this->request_type === ReturnRequestType::EXCHANGE;
    }

    public function isReplacement(): bool
    {
        return $this->request_type === ReturnRequestType::REPLACEMENT;
    }

    public function isReturnRefund(): bool
    {
        return $this->request_type === ReturnRequestType::RETURN_REFUND;
    }

    public function isWindowOpen(): bool
    {
        return $this->window_expires_at && now()->lessThan($this->window_expires_at);
    }
}
