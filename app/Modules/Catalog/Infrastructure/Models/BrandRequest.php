<?php

namespace App\Modules\Catalog\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BrandRequest extends BaseModel
{
    protected $fillable = [
        'vendor_id',
        'brand_id',
        'brand_name',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReviewStatus::class,
            'reviewed_at' => 'datetime',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Vendor\Infrastructure\Models\Vendor::class);
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(config('auth.providers.users.model'), 'reviewed_by');
    }
}
