<?php

namespace App\Modules\Catalog\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductVariant extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'sku',
        'name',
        'combination_hash',
        'price',
        'compare_at_price',
        'quantity',
        'stock_status',
        'image',
        'options',
        'is_default',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'options' => 'array',
            'is_default' => 'boolean',
            'deleted_by' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class, 'variant_id');
    }

    public function attributeValues(): HasMany
    {
        return $this->hasMany(ProductAttributeValue::class, 'variant_id');
    }
}
