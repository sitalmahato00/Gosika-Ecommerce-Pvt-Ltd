<?php

namespace App\Modules\Shipping\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\SoftDeletes;

class ShippingZone extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'provinces',
        'standard_charge',
        'express_charge',
        'estimated_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'provinces' => 'array',
            'standard_charge' => 'decimal:2',
            'express_charge' => 'decimal:2',
            'estimated_days' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function matchesLocation(?string $province = null, ?string $district = null, ?string $municipality = null): bool
    {
        if (empty($this->provinces)) {
            return false;
        }

        $values = array_filter(array_map(fn ($value) => trim((string) $value), [$province, $district, $municipality]));

        if ($values === []) {
            return false;
        }

        foreach ($values as $value) {
            $needle = mb_strtolower($value);
            foreach ($this->provinces as $provinceName) {
                $area = mb_strtolower((string) $provinceName);
                if ($area === $needle || str_contains($area, $needle) || str_contains($needle, $area)) {
                    return true;
                }
            }
        }

        return false;
    }
}
