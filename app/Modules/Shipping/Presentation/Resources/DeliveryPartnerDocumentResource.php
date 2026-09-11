<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryPartnerDocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'document_type' => $this->document_type,
            'file_url' => '/storage/'.$this->file_path,
            'mime_type' => $this->mime_type,
            'file_size' => (int) $this->file_size,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'uploaded_at' => $this->created_at?->toISOString(),
        ];
    }
}