<?php

namespace App\Modules\Platform\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class Setting extends BaseModel
{
    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'description',
        'is_public',
        'is_encrypted',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
            'is_encrypted' => 'boolean',
        ];
    }

    public function getDecryptedValue(): mixed
    {
        if (! $this->is_encrypted || empty($this->value)) {
            return $this->castTypedValue($this->value);
        }

        try {
            $decrypted = Crypt::decryptString($this->value);
            return $this->castTypedValue($decrypted);
        } catch (\Throwable) {
            return $this->castTypedValue($this->value);
        }
    }

    public function castTypedValue(mixed $val): mixed
    {
        if ($val === null) {
            return null;
        }

        return match ($this->type) {
            'boolean' => $val === true || $val === 'true' || $val === 1 || $val === '1',
            'integer' => (int) $val,
            'decimal' => (float) $val,
            'json' => is_string($val) ? json_decode($val, true) : $val,
            default => (string) $val,
        };
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::where('key', $key)->first();

        if (! $row) {
            return $default;
        }

        return $row->getDecryptedValue() ?? $default;
    }

    public static function set(
        string $key,
        mixed $value,
        string $group = 'general',
        string $type = 'string',
        bool $isPublic = false,
        bool $isEncrypted = false,
        ?string $description = null
    ): self {
        $storeValue = $value;

        if ($storeValue !== null && $isEncrypted) {
            $storeValue = Crypt::encryptString(is_scalar($storeValue) ? (string) $storeValue : json_encode($storeValue));
        } elseif ($storeValue !== null && ! is_scalar($storeValue)) {
            $storeValue = json_encode($storeValue);
        }

        return static::updateOrCreate(['key' => $key], [
            'uuid' => (string) Str::uuid(),
            'value' => $storeValue === null ? null : (string) $storeValue,
            'group' => $group,
            'type' => $type,
            'description' => $description,
            'is_public' => $isPublic,
            'is_encrypted' => $isEncrypted,
        ]);
    }
}
