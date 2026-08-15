<?php

namespace App\Modules\Vendor\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorDocument extends BaseModel
{
    protected $fillable = [
        'vendor_id',
        'vendor_kyc_id',
        'document_type',
        'file_path',
        'mime_type',
        'file_size',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function kyc(): BelongsTo
    {
        return $this->belongsTo(VendorKyc::class, 'vendor_kyc_id');
    }
}
