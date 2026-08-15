<?php

namespace App\Modules\Shared\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Traits\Blameable;
use App\Modules\Shared\Infrastructure\Traits\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

abstract class BaseModel extends Model
{
    use HasUuid;
    use Blameable;

    protected $guarded = ['id', 'uuid'];

    public static function bootBaseModel(): void
    {
        //
    }

    public function creator()
    {
        return $this->belongsTo(config('auth.providers.users.model'), 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(config('auth.providers.users.model'), 'updated_by');
    }
}
