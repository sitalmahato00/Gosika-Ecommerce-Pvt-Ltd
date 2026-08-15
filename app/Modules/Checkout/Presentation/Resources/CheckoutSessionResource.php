<?php

namespace App\Modules\Checkout\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CheckoutSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'shipping_address' => new \App\Modules\Customer\Presentation\Resources\CustomerAddressResource($this->whenLoaded('shippingAddress')),
            'billing_address' => new \App\Modules\Customer\Presentation\Resources\CustomerAddressResource($this->whenLoaded('billingAddress')),
            'subtotal' => number_format((float) $this->subtotal, 2, '.', ''),
            'discount' => number_format((float) $this->discount, 2, '.', ''),
            'delivery_charge' => number_format((float) $this->delivery_charge, 2, '.', ''),
            'tax' => number_format((float) $this->tax, 2, '.', ''),
            'total' => number_format((float) $this->total, 2, '.', ''),
            'expires_at' => $this->expires_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
