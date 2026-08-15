<?php

namespace App\Modules\Vendor\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Vendor extends BaseModel
{
    protected $fillable = [
        'user_id',
        'company_name',
        'business_email',
        'business_phone',
        'pan_vat',
        'registration_number',
        'logo',
        'status',
        'commission_rate',
        'rejection_reason',
        'meta',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => VendorStatus::class,
            'commission_rate' => 'decimal:2',
            'meta' => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function kyc(): HasOne
    {
        return $this->hasOne(VendorKyc::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(VendorDocument::class);
    }

    public function stores(): HasMany
    {
        return $this->hasMany(Store::class);
    }

    public function bankAccounts(): HasMany
    {
        return $this->hasMany(BankAccount::class);
    }

    public function wallet()
    {
        return $this->hasOne(\App\Modules\Wallet\Infrastructure\Models\VendorWallet::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(VendorOrder::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', VendorStatus::PENDING);
    }
}
