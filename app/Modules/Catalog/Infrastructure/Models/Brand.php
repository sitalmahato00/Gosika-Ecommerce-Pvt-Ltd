<?php

namespace App\Modules\Catalog\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Brand extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'logo',
        'description',
        'status',
        'deleted_by',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
