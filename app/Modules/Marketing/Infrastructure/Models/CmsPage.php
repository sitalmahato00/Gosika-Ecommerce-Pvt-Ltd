<?php

namespace App\Modules\Marketing\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

class CmsPage extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'body',
        'type',
        'status',
        'meta',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
            'sort_order' => 'integer',
        ];
    }
}