<?php

namespace App\Modules\Marketplace\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreReview extends BaseModel
{
    protected $fillable = [
        'user_id',
        'store_id',
        'vendor_order_id',
        'rating',
        'body',
        'status',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'status' => ReviewStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', ReviewStatus::APPROVED);
    }
}
