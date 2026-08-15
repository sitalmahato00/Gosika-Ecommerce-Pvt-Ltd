<?php

namespace App\Modules\Administration\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends BaseModel
{
    protected $fillable = [
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'ip_address',
        'user_agent',
        'old_values',
        'new_values',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
