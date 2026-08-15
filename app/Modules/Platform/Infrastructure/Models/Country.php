<?php

namespace App\Modules\Platform\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends BaseModel
{
    protected $fillable = [
        'name',
        'code',
        'phone_code',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function provinces(): HasMany
    {
        return $this->hasMany(Province::class);
    }
}
