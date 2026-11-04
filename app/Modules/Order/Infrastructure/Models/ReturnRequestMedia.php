<?php

namespace App\Modules\Order\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnRequestMedia extends BaseModel
{
    protected $fillable = [
        'return_request_id',
        'type',
        'path',
        'mime_type',
        'size',
        'original_name',
        'uploaded_by',
    ];

    public function returnRequest(): BelongsTo
    {
        return $this->belongsTo(ReturnRequest::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /** Full public URL for the media file */
    public function getUrlAttribute(): string
    {
        return \Storage::url($this->path);
    }
}
