<?php

namespace App\Modules\Customer\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerWallet extends BaseModel
{
    protected $fillable = [
        'user_id',
        'balance',
        'currency',
        'version',
    ];

    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'version' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(CustomerWalletTransaction::class, 'wallet_id');
    }
}