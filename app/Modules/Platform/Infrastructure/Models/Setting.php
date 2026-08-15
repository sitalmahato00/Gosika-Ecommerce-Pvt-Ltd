<?php

namespace App\Modules\Platform\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;

class Setting extends BaseModel
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::where('key', $key)->first();

        return $row?->value ?? $default;
    }

    public static function set(string $key, mixed $value, string $group = 'general', string $type = 'string', bool $isPublic = false): self
    {
        return static::updateOrCreate(['key' => $key], [
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'value' => $value === null ? '' : (is_scalar($value) ? $value : json_encode($value)),
            'group' => $group,
            'type' => $type,
            'is_public' => $isPublic,
        ]);
    }
}
