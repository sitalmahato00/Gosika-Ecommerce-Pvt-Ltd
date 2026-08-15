<?php

namespace App\Modules\Platform\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Municipality extends BaseModel
{
    protected $fillable = [
        'district_id',
        'name',
        'type',
        'ward_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'ward_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(District::class);
    }
}
