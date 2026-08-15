<?php

namespace App\Modules\Payment\Infrastructure\Models;

use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Shared\Domain\Enums\PaymentStatus;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentStatusHistory extends BaseModel
{
    protected $table = 'payment_status_history';

    protected $fillable = [
        'payment_id',
        'from_status',
        'to_status',
        'reason',
        'actor_user_id',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'from_status' => PaymentStatus::class,
            'to_status' => PaymentStatus::class,
            'meta' => 'array',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}
