<?php

namespace App\Modules\Support\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorTicketResource extends JsonResource
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
            'order_id' => $this->order?->uuid,
            'vendor_order_id' => $this->vendorOrder?->uuid,
            'customer' => $this->user ? [
                'id' => $this->user->uuid,
                'full_name' => $this->user->full_name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
            'resolved_at' => $this->resolved_at?->toISOString(),
            'last_message_at' => $this->messages->max('created_at')?->toISOString(),
            'attachments' => $this->meta['attachments'] ?? [],
            'messages' => $this->whenLoaded('messages', fn () => $this->messages->map(fn ($message) => [
                'id' => $message->uuid,
                'message' => $message->message,
                'sender' => $message->sender ? [
                    'id' => $message->sender->uuid,
                    'full_name' => $message->sender->full_name,
                ] : null,
                'is_internal' => $message->is_internal,
                'attachments' => $message->attachments,
                'created_at' => $message->created_at?->toISOString(),
            ])),
        ];
    }
}
