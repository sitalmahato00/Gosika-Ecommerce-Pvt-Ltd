<?php

namespace App\Modules\Marketing\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

class Banner extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'image',
        'link',
        'position',
        'sort_order',
        'is_active',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'date',
            'ends_at' => 'date',
        ];
    }
}
