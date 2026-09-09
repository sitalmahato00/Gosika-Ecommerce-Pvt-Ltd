<?php

namespace App\Modules\Vendor\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SellerTier extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'badge_level',
        'min_orders',
        'min_gmv',
        'commission_percent',
        'badge_color',
        'badge_icon',
        'description',
        'benefits',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'badge_level' => 'integer',
            'min_orders' => 'integer',
            'min_gmv' => 'decimal:2',
            'commission_percent' => 'decimal:2',
            'benefits' => 'array',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function vendors(): HasMany
    {
        return $this->hasMany(Vendor::class, 'seller_tier_id');
    }
}