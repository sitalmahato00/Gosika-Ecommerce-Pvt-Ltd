<?php

namespace App\Modules\Marketing\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

class Broadcast extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'message',
        'channel',
        'target_type',
        'target_ids',
        'status',
        'reach',
        'sent_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'target_ids' => 'array',
            'reach' => 'integer',
            'sent_at' => 'datetime',
        ];
    }
}
