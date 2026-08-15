<?php

namespace App\Modules\Support\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'sender' => $this->sender ? [
                'id' => $this->sender->uuid,
                'name' => $this->sender->name,
                'is_staff' => $this->sender->hasRole('super_admin'),
            ] : null,
            'message' => $this->message,
            'is_internal' => $this->is_internal,
            'attachments' => $this->attachments,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
