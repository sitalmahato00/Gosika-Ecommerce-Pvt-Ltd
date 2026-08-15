<?php

namespace App\Modules\Shared\Infrastructure\Traits;

use Illuminate\Support\Facades\Auth;

trait Blameable
{
    protected static function bootBlameable(): void
    {
        static::creating(function ($model) {
            if (! $model->created_by && Auth::check()) {
                $model->created_by = Auth::id();
            }
            if (! $model->updated_by && Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });

        if (in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses_recursive(static::class))) {
            static::deleting(function ($model) {
                if (! $model->isForceDeleting() && Auth::check()) {
                    $model->deleted_by = Auth::id();
                    $model->save();
                }
            });
        }
    }
}
