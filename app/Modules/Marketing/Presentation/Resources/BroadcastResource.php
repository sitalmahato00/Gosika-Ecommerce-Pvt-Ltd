<?php

namespace App\Modules\Marketing\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BroadcastResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'title' => $this->title,
            'message' => $this->message,
            'channel' => $this->channel,
            'target_type' => $this->target_type,
            'target_ids' => $this->target_ids,
            'status' => $this->status,
            'reach' => $this->reach,
            'sent_at' => $this->sent_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
