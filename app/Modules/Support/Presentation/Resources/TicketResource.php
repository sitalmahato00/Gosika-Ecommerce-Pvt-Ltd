<?php

namespace App\Modules\Support\Presentation\Resources;

use App\Modules\Identity\Presentation\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'description' => $this->description,
            'category' => $this->category,
            'priority' => $this->priority,
            'status' => $this->status->value,
            'customer' => new UserResource($this->whenLoaded('user')),
            'order_id' => $this->order?->uuid,
            'order_number' => $this->order?->order_number,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'messages' => TicketMessageResource::collection($this->whenLoaded('messages')),
            'resolved_at' => $this->resolved_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
