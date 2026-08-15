<?php

namespace App\Modules\Marketing\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorNotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'category' => $this->type,
            'title' => $this->title,
            'message' => $this->body,
            'link' => $this->data['link'] ?? null,
            'priority' => $this->data['priority'] ?? 'normal',
            'created_at' => $this->created_at?->toISOString(),
            'read_at' => $this->read_at?->toISOString(),
        ];
    }
}
