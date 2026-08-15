<?php

namespace App\Modules\Marketing\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class VendorPromotion extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'vendor_id',
        'name',
        'tagline',
        'type',
        'discount_value',
        'category',
        'banner_image',
        'start_date',
        'end_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
