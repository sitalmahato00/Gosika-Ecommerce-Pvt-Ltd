<?php

namespace App\Modules\Seo\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;

class SeoRedirect extends BaseModel
{
    protected $table = 'seo_redirects';

    protected $fillable = [
        'source_path',
        'target_path',
        'redirect_type',
        'is_active',
        'hit_count',
        'last_hit_at',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active'     => 'boolean',
            'redirect_type' => 'integer',
            'hit_count'     => 'integer',
            'last_hit_at'   => 'datetime',
        ];
    }
}
