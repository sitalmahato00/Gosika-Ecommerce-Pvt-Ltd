<?php

namespace App\Modules\Marketplace\Infrastructure\Models;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WishlistItem extends BaseModel
{
    protected $fillable = [
        'wishlist_id',
        'product_id',
    ];

    public function wishlist(): BelongsTo
    {
        return $this->belongsTo(Wishlist::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
