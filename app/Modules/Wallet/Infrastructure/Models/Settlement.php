<?php

namespace App\Modules\Wallet\Infrastructure\Models;

use App\Modules\Shared\Domain\Enums\SettlementStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Settlement extends BaseModel
{
    protected $fillable = [
        'settlement_number',
        'vendor_id',
        'period_start',
        'period_end',
        'gross_sales',
        'commission_total',
        'refunds_total',
        'adjustments_total',
        'net_payable',
        'status',
        'hold_reason',
        'generated_at',
        'paid_at',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'gross_sales' => 'decimal:2',
            'commission_total' => 'decimal:2',
            'refunds_total' => 'decimal:2',
            'adjustments_total' => 'decimal:2',
            'net_payable' => 'decimal:2',
            'status' => SettlementStatus::class,
            'generated_at' => 'datetime',
            'paid_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function payoutRequests(): HasMany
    {
        return $this->hasMany(PayoutRequest::class);
    }
}
