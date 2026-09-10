<?php

namespace App\Modules\Wallet\Infrastructure\Models;

use App\Modules\Catalog\Infrastructure\Models\Category;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CategoryCommissionRule extends Model
{
    protected $fillable = [
        'category_id',
        'commission_rate',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}