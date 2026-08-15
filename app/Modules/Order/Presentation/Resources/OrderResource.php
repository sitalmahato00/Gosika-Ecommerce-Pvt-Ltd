<?php

namespace App\Modules\Order\Presentation\Resources;

use App\Modules\Shared\Domain\Enums\OrderStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $shipping = $this->shipping_address_snapshot ? json_decode($this->shipping_address_snapshot, true) : null;

        return [
            'id' => $this->uuid,
            'order_number' => $this->order_number,
            'status' => $this->status->value,
            'payment_method' => $this->payment_method,
            'payment_status' => $this->payment_status->value,
            'subtotal' => number_format((float) $this->subtotal, 2, '.', ''),
            'discount' => number_format((float) $this->discount, 2, '.', ''),
            'delivery_charge' => number_format((float) $this->delivery_charge, 2, '.', ''),
            'tax' => number_format((float) $this->tax, 2, '.', ''),
            'grand_total' => number_format((float) $this->grand_total, 2, '.', ''),
            'currency' => $this->currency,
            'shipping_address' => $shipping,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'vendor_orders' => VendorOrderResource::collection($this->whenLoaded('vendorOrders')),
            'customer_notes' => $this->customer_notes,
            'placed_at' => $this->placed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'can_cancel' => in_array($this->status->value, [OrderStatus::PENDING->value, OrderStatus::PAYMENT_PENDING->value, OrderStatus::CONFIRMED->value], true)
                && $this->payment_status->value !== 'paid',
        ];
    }
}
