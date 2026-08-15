<?php

namespace App\Modules\Order\Infrastructure\Models;

use App\Modules\Checkout\Infrastructure\Models\CheckoutSession;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'order_number',
        'user_id',
        'checkout_session_id',
        'shipping_address_id',
        'shipping_address_snapshot',
        'payment_method',
        'payment_status',
        'status',
        'subtotal',
        'discount',
        'delivery_charge',
        'tax',
        'grand_total',
        'currency',
        'coupon_code',
        'customer_notes',
        'meta',
        'placed_at',
        'confirmed_at',
        'completed_at',
        'cancelled_at',
        'cancelled_reason',
        'cancelled_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'payment_status' => OrderPaymentStatus::class,
            'status' => OrderStatus::class,
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'delivery_charge' => 'decimal:2',
            'tax' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'meta' => 'array',
            'placed_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'deleted_by' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function checkoutSession(): BelongsTo
    {
        return $this->belongsTo(CheckoutSession::class);
    }

    public function shippingAddress(): BelongsTo
    {
        return $this->belongsTo(CustomerAddress::class, 'shipping_address_id');
    }

    public function vendorOrders(): HasMany
    {
        return $this->hasMany(VendorOrder::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class, 'trackable_id')->where('trackable_type', static::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
