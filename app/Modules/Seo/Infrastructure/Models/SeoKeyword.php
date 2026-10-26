<?php

namespace App\Modules\Seo\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;

class SeoKeyword extends BaseModel
{
    protected $table = 'seo_keywords';

    protected $fillable = [
        'keyword',
        'language',
        'search_intent',
        'entity_type',
        'priority',
        'notes',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'priority'  => 'integer',
        ];
    }
}
