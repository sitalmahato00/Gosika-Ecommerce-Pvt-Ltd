<?php

namespace App\Modules\Shipping\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

class Courier extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'logo',
        'contact_phone',
        'contact_email',
        'tracking_url_pattern',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
