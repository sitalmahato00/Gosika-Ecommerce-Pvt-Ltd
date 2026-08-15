<?php

namespace App\Modules\Marketplace\Infrastructure\Models;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductReview extends BaseModel
{
    protected $fillable = [
        'user_id',
        'product_id',
        'vendor_order_item_id',
        'rating',
        'title',
        'body',
        'status',
        'reviewed_by',
        'reviewed_at',
        'reply',
        'replied_by',
        'replied_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'status' => ReviewStatus::class,
            'reviewed_at' => 'datetime',
            'replied_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function repliedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replied_by');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class, 'vendor_order_item_id');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', ReviewStatus::APPROVED);
    }
}
