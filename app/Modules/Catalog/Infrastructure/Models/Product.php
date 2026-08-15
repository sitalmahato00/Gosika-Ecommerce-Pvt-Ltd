<?php

namespace App\Modules\Catalog\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'vendor_id',
        'store_id',
        'category_id',
        'brand_id',
        'name',
        'slug',
        'description',
        'short_description',
        'sku',
        'barcode',
        'status',
        'stock_status',
        'quantity',
        'low_stock_threshold',
        'price',
        'compare_at_price',
        'cost_price',
        'currency',
        'weight_grams',
        'dimensions',
        'hs_code',
        'tax_rate',
        'manufacturer',
        'is_variant',
        'is_featured',
        'is_negotiable',
        'views_count',
        'rating_avg',
        'rating_count',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProductStatus::class,
            'stock_status' => \App\Modules\Shared\Domain\Enums\StockStatus::class,
            'price' => 'decimal:2',
            'compare_at_price' => 'decimal:2',
            'cost_price' => 'decimal:2',
            'is_variant' => 'boolean',
            'is_featured' => 'boolean',
            'is_negotiable' => 'boolean',
            'views_count' => 'integer',
            'rating_avg' => 'decimal:2',
            'rating_count' => 'integer',
            'meta' => 'array',
            'deleted_by' => 'integer',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Vendor\Infrastructure\Models\Vendor::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Vendor\Infrastructure\Models\Store::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function attributes(): HasMany
    {
        return $this->hasMany(ProductAttribute::class);
    }

    public function primaryImage()
    {
        return $this->hasOne(ProductImage::class)->where('is_primary', true);
    }

    public function scopePublished($query)
    {
        return $query->where('status', ProductStatus::PUBLISHED);
    }

    public function scopeAvailable($query)
    {
        return $query->where('status', ProductStatus::PUBLISHED)
            ->where('stock_status', '!=', \App\Modules\Shared\Domain\Enums\StockStatus::OUT_OF_STOCK);
    }
}
