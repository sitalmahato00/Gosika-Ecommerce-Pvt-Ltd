<?php

namespace App\Modules\Seo\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;

class SeoTemplate extends BaseModel
{
    protected $table = 'seo_templates';

    protected $fillable = [
        'entity_type',
        'name',
        'title_template',
        'description_template',
        'is_default',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_active'  => 'boolean',
        ];
    }
}
