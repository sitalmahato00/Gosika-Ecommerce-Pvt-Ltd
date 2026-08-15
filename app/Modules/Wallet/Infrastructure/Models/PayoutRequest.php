<?php

namespace App\Modules\Wallet\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\PayoutStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayoutRequest extends BaseModel
{
    protected $fillable = [
        'payout_number',
        'vendor_id',
        'settlement_id',
        'wallet_id',
        'bank_account_id',
        'amount',
        'status',
        'requested_at',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'paid_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'status' => PayoutStatus::class,
            'requested_at' => 'datetime',
            'approved_at' => 'datetime',
            'paid_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function settlement(): BelongsTo
    {
        return $this->belongsTo(Settlement::class);
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(VendorWallet::class, 'wallet_id');
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function records(): HasMany
    {
        return $this->hasMany(PayoutRecord::class);
    }
}
