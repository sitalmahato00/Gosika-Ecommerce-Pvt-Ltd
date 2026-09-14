<?php

namespace App\Modules\Marketing\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryNotification extends BaseModel
{
    protected $table = 'delivery_notifications';

    protected $fillable = [
        'delivery_partner_id',
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    public function deliveryPartner(): BelongsTo
    {
        return $this->belongsTo(DeliveryPartner::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}