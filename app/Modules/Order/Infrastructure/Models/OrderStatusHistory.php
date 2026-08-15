<?php

namespace App\Modules\Order\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class OrderStatusHistory extends BaseModel
{
    protected $table = 'order_status_history';

    protected $fillable = [
        'trackable_type',
        'trackable_id',
        'from_status',
        'to_status',
        'reason',
        'actor_user_id',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function trackable(): MorphTo
    {
        return $this->morphTo();
    }
}
