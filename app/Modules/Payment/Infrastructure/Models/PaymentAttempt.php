<?php

namespace App\Modules\Payment\Infrastructure\Models;

use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Shared\Domain\Enums\PaymentStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentAttempt extends BaseModel
{
    protected $fillable = [
        'payment_id',
        'attempt_number',
        'status',
        'provider_pidx',
        'request_payload',
        'response_payload',
        'error_message',
        'initiated_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'request_payload' => 'array',
            'response_payload' => 'array',
            'initiated_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
