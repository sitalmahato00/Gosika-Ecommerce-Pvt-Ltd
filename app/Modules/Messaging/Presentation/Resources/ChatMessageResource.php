<?php

namespace App\Modules\Messaging\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChatMessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'cursor' => $this->id,
            'message' => $this->message,
            'images' => collect($this->images ?? [])
                ->map(fn (string $path, int $index): string => url(
                    '/api/v1/conversations/'.($this->conversation_uuid ?? $this->conversation?->uuid)
                    .'/messages/'.$this->uuid.'/images/'.$index
                ))
                ->values(),
            'client_uuid' => $this->client_uuid,
            'sender' => $this->sender ? [
                'id' => $this->sender->uuid,
                'name' => $this->sender->full_name ?: $this->sender->name,
            ] : null,
            'read_at' => $this->read_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
