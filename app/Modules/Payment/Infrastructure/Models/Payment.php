<?php

namespace App\Modules\Payment\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\PaymentStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'payment_number',
        'order_id',
        'vendor_order_id',
        'user_id',
        'amount',
        'currency',
        'method',
        'provider',
        'status',
        'provider_pidx',
        'provider_transaction_id',
        'provider_refund_id',
        'payer_name',
        'payer_email',
        'payer_phone',
        'provider_request',
        'provider_response',
        'initiated_at',
        'verified_at',
        'expires_at',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'status' => PaymentStatus::class,
            'provider_request' => 'array',
            'provider_response' => 'array',
            'initiated_at' => 'datetime',
            'verified_at' => 'datetime',
            'expires_at' => 'datetime',
            'deleted_by' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(PaymentAttempt::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(PaymentStatusHistory::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', [PaymentStatus::INITIATED, PaymentStatus::PROCESSING, PaymentStatus::VERIFICATION]);
    }

    public function scopeForOrder($query, int $orderId)
    {
        return $query->where('order_id', $orderId);
    }

    public function isPaid(): bool
    {
        return $this->status === PaymentStatus::PAID;
    }

    public function isSettled(): bool
    {
        return $this->order?->payment_status === OrderPaymentStatus::PAID;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
