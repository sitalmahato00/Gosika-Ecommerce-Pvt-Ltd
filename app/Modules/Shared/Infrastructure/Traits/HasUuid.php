<?php

namespace App\Modules\Shared\Infrastructure\Traits;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

trait HasUuid
{
    protected static function bootHasUuid(): void
    {
        static::creating(function ($model) {
            $col = $model->getUuidColumn();
            if (Schema::hasColumn($model->getTable(), $col) && empty($model->{$col})) {
                $model->{$col} = Str::uuid()->toString();
            }
        });
    }

    public function getUuidColumn(): string
    {
        return 'uuid';
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}
