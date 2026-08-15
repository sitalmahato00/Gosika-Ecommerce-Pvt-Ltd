<?php

namespace App\Modules\Order\Infrastructure\Models;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\ProductVariant;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends BaseModel
{
    protected $fillable = [
        'order_id',
        'vendor_order_id',
        'vendor_id',
        'product_id',
        'variant_id',
        'product_name',
        'sku',
        'variant_name',
        'image',
        'quantity',
        'unit_price',
        'unit_discount',
        'line_total',
        'delivery_status',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'unit_discount' => 'decimal:2',
            'line_total' => 'decimal:2',
            'delivery_status' => DeliveryStatus::class,
            'meta' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
