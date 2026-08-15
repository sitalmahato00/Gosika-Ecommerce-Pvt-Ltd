<?php

namespace App\Modules\Wallet\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\WalletTransactionType;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends BaseModel
{
    protected $fillable = [
        'wallet_id',
        'transaction_type',
        'reference_type',
        'reference_id',
        'amount',
        'balance_before',
        'balance_after',
        'status',
        'description',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'transaction_type' => WalletTransactionType::class,
            'amount' => 'decimal:2',
            'balance_before' => 'decimal:2',
            'balance_after' => 'decimal:2',
            'meta' => 'array',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(VendorWallet::class, 'wallet_id');
    }
}
