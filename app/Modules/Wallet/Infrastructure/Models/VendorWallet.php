<?php

namespace App\Modules\Wallet\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorWallet extends BaseModel
{
    protected $fillable = [
        'vendor_id',
        'balance',
        'available_balance',
        'pending_balance',
        'currency',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'available_balance' => 'decimal:2',
            'pending_balance' => 'decimal:2',
            'version' => 'integer',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class, 'wallet_id');
    }

    public function payoutRequests(): HasMany
    {
        return $this->hasMany(PayoutRequest::class, 'wallet_id');
    }
}
