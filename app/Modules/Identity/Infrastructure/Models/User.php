<?php

namespace App\Modules\Identity\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Infrastructure\Traits\HasUuid;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens;
    use HasFactory;
    use HasRoles;
    use HasUuid;
    use Notifiable;

    protected $guarded = ['id', 'uuid'];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => UserStatus::class,
            'meta' => 'array',
            'last_login_at' => 'datetime',
        ];
    }

    protected static function newFactory(): \Database\Factories\UserFactory
    {
        return \Database\Factories\UserFactory::new();
    }

    public function getFullNameAttribute(): string
    {
        return trim(($this->first_name ?? '').' '.($this->last_name ?? ''));
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::ACTIVE;
    }

    public function scopeActive($query)
    {
        return $query->where('status', UserStatus::ACTIVE);
    }

    public function vendor()
    {
        return $this->hasOne(\App\Modules\Vendor\Infrastructure\Models\Vendor::class);
    }

    public function customerProfile()
    {
        return $this->hasOne(\App\Modules\Customer\Infrastructure\Models\CustomerProfile::class);
    }

    public function customerWallet()
    {
        return $this->hasOne(\App\Modules\Customer\Infrastructure\Models\CustomerWallet::class);
    }

    public function orders()
    {
        return $this->hasMany(\App\Modules\Order\Infrastructure\Models\Order::class);
    }

    public function addresses()
    {
        return $this->hasMany(\App\Modules\Customer\Infrastructure\Models\CustomerAddress::class);
    }

    public function deliveryPartner()
    {
        return $this->hasOne(\App\Modules\Shipping\Infrastructure\Models\DeliveryPartner::class);
    }
}
