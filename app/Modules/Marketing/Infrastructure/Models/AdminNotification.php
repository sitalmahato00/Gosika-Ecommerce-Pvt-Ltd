<?php

namespace App\Modules\Marketing\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminNotification extends BaseModel
{
    protected $table = 'admin_notifications';

    protected $fillable = [
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}