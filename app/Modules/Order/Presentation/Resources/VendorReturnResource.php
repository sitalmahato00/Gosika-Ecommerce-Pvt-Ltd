<?php

namespace App\Modules\Order\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorReturnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->uuid,
            'return_number'       => $this->return_number,

            // Request details
            'request_type'        => $this->request_type?->value,
            'request_type_label'  => $this->request_type?->label(),
            'reason_type'         => $this->reason_type,
            'reason'              => $this->reason,
            'quantity'            => $this->quantity,
            'refund_amount'       => number_format((float) $this->refund_amount, 2, '.', ''),
            'preferred_resolution'=> $this->preferred_resolution,

            // Status
            'status'              => $this->status?->value,
            'status_label'        => $this->status?->label(),
            'review_notes'        => $this->review_notes,
            'window_expires_at'   => $this->window_expires_at?->toISOString(),

            // Return logistics
            'return_method'       => $this->return_method,
            'pickup_instructions' => $this->pickup_instructions,
            'pickup_collected_at' => $this->pickup_collected_at?->toISOString(),

            // Inspection
            'inspection_condition'=> $this->inspection_condition?->value,
            'inspection_condition_label' => $this->inspection_condition?->label(),
            'inspection_notes'    => $this->inspection_notes,
            'inspection_photos'   => $this->inspection_photos
                ? collect($this->inspection_photos)->map(fn ($p) => \Storage::url($p))->values()
                : [],
            'inspected_at'        => $this->inspected_at?->toISOString(),

            // Resolution tracking
            'exchange_dispatched_at'    => $this->exchange_dispatched_at?->toISOString(),
            'replacement_dispatched_at' => $this->replacement_dispatched_at?->toISOString(),
            'closed_at'           => $this->closed_at?->toISOString(),

            // Customer info
            'customer'            => [
                'id'        => $this->user?->uuid,
                'full_name' => $this->user?->full_name,
                'email'     => $this->user?->email,
                'phone'     => $this->user?->phone,
            ],

            // Product / order
            'product_name'        => $this->orderItem?->product_name,
            'product_image'       => $this->orderItem?->image ?? $this->orderItem?->product?->primaryImage?->file_path,
            'order_id'            => $this->order?->uuid,
            'order_number'        => $this->order?->order_number,

            // Media (evidence uploaded by customer)
            'media'               => $this->whenLoaded('media', fn () =>
                $this->media->map(fn ($m) => [
                    'id'            => $m->uuid,
                    'type'          => $m->type,
                    'url'           => $m->url,
                    'mime_type'     => $m->mime_type,
                    'original_name' => $m->original_name,
                    'size'          => $m->size,
                ])
            ),

            // Status history
            'status_history'      => $this->whenLoaded('statusHistory', fn () =>
                $this->statusHistory->map(fn ($h) => [
                    'from'       => $h->from_status,
                    'to'         => $h->to_status,
                    'notes'      => $h->notes,
                    'changed_by' => $h->changedBy?->full_name,
                    'at'         => $h->created_at?->toISOString(),
                ])
            ),

            // Timestamps
            'created_at'          => $this->created_at?->toISOString(),
            'reviewed_at'         => $this->reviewed_at?->toISOString(),
        ];
    }
}
