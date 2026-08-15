<?php

namespace App\Modules\Customer\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerProfile extends BaseModel
{
    protected $fillable = [
        'user_id',
        'gender',
        'date_of_birth',
        'default_shipping_address_id',
        'default_billing_address_id',
        'preferences',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
            'preferences' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function defaultShippingAddress(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'default_shipping_address_id');
    }

    public function defaultBillingAddress(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'default_billing_address_id');
    }
}
