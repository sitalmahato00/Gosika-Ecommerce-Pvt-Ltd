<?php

namespace App\Modules\Vendor\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BankAccount extends BaseModel
{
    protected $fillable = [
        'vendor_id',
        'bank_name',
        'branch_name',
        'account_name',
        'account_number',
        'account_type',
        'is_verified',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'is_default' => 'boolean',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
