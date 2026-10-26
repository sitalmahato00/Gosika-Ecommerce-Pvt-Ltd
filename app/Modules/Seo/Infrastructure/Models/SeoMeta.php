<?php

namespace App\Modules\Seo\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;

class SeoMeta extends BaseModel
{
    protected $table = 'seo_meta';

    protected $fillable = [
        'entity_type',
        'entity_id',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'canonical_url',
        'robots',
        'og_title',
        'og_description',
        'og_image',
        'twitter_card',
        'twitter_title',
        'twitter_description',
        'is_noindex',
        'is_nofollow',
        'structured_data',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'structured_data' => 'array',
            'is_noindex'      => 'boolean',
            'is_nofollow'     => 'boolean',
        ];
    }
}
