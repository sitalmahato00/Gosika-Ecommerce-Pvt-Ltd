<?php

namespace App\Modules\Shared\Infrastructure\Traits;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait Blameable
{
    protected static function bootBlameable(): void
    {
        static::creating(function ($model) {
            if (Auth::check()) {
                if (static::hasBlameableColumn('created_by') && ! $model->created_by) {
                    $model->created_by = Auth::id();
                }
                if (static::hasBlameableColumn('updated_by') && ! $model->updated_by) {
                    $model->updated_by = Auth::id();
                }
            }
        });

        static::updating(function ($model) {
            if (Auth::check() && static::hasBlameableColumn('updated_by')) {
                $model->updated_by = Auth::id();
            }
        });

        if (in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive(static::class))) {
            static::deleting(function ($model) {
                if (! $model->isForceDeleting() && Auth::check() && static::hasBlameableColumn('deleted_by')) {
                    $model->deleted_by = Auth::id();
                    $model->save();
                }
            });
        }
    }

    protected static function hasBlameableColumn(string $column): bool
    {
        static $cache = [];
        $table = (new static)->getTable();
        $key   = $table . '.' . $column;

        return $cache[$key] ??= Schema::hasColumn($table, $column);
    }
}
