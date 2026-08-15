<?php

namespace App\Modules\Marketplace\Infrastructure\Models;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wishlist extends BaseModel
{
    protected $fillable = [
        'user_id',
        'name',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(WishlistItem::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(WishlistItem::class)->with('product');
    }
}
