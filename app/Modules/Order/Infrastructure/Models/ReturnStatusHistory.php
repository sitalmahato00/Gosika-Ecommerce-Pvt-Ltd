<?php

namespace App\Modules\Order\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnStatusHistory extends Model
{
    protected $table = 'return_status_history';

    protected $fillable = [
        'return_request_id',
        'from_status',
        'to_status',
        'notes',
        'changed_by',
    ];

    public function getTable()
    {
        if (\Illuminate\Support\Facades\Schema::hasTable('return_status_history')) {
            return 'return_status_history';
        }

        if (\Illuminate\Support\Facades\Schema::hasTable('return_status_histories')) {
            return 'return_status_histories';
        }

        return $this->table;
    }

    public function returnRequest(): BelongsTo
    {
        return $this->belongsTo(ReturnRequest::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
