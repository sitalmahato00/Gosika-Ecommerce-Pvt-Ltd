<?php

namespace App\Modules\Checkout\Infrastructure\Models;

use App\Modules\Cart\Infrastructure\Models\Cart;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CheckoutSession extends BaseModel
{
    protected $fillable = [
        'user_id',
        'cart_id',
        'shipping_address_id',
        'billing_address_id',
        'coupon_code',
        'payment_method',
        'subtotal',
        'discount',
        'delivery_charge',
        'tax',
        'total',
        'status',
        'shipping_breakdown',
        'meta',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'delivery_charge' => 'decimal:2',
            'tax' => 'decimal:2',
            'total' => 'decimal:2',
            'shipping_breakdown' => 'array',
            'meta' => 'array',
            'expires_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'shipping_address_id');
    }

    public function billingAddress(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'billing_address_id');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
