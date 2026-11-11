<?php

namespace App\Modules\Messaging\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'type' => $this->type,
            'subject' => $this->subject,
            'customer_id' => $this->customer?->uuid,
            'customer_name' => $this->customer?->full_name ?: $this->customer?->name,
            'vendor_id' => $this->vendor?->uuid,
            'vendor_name' => $this->vendor?->company_name,
            'store_id' => $this->store?->uuid,
            'store_name' => $this->store?->name,
            'unread_count' => (int) ($this->unread_count ?? 0),
            'last_message' => $this->whenLoaded('latestMessage', fn () => $this->latestMessage
                ? (new ChatMessageResource($this->latestMessage))->resolve($request)
                : null),
            'messages' => ChatMessageResource::collection($this->whenLoaded('messages')),
            'last_message_at' => $this->last_message_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
