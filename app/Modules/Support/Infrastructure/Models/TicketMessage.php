<?php

namespace App\Modules\Support\Infrastructure\Models;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Infrastructure\Models\BaseModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketMessage extends BaseModel
{
    protected $fillable = [
        'support_ticket_id',
        'sender_user_id',
        'message',
        'is_internal',
        'attachments',
    ];

    protected function casts(): array
    {
        return [
            'is_internal' => 'boolean',
            'attachments' => 'array',
        ];
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(SupportTicket::class, 'support_ticket_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }
}
