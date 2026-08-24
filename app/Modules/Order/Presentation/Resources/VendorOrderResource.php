<?php

namespace App\Modules\Order\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $shipping = null;
        if ($this->order) {
            if ($this->order->shipping_address_snapshot) {
                $raw = is_string($this->order->shipping_address_snapshot)
                    ? json_decode($this->order->shipping_address_snapshot, true)
                    : $this->order->shipping_address_snapshot;

                if (is_array($raw)) {
                    $shipping = [
                        'name' => $raw['full_name'] ?? $raw['name'] ?? ($this->order->user?->full_name ?? 'Customer'),
                        'phone' => $raw['phone'] ?? $this->order->user?->phone ?? '9800000000',
                        'street' => $raw['address_line_1'] ?? $raw['street'] ?? 'Baluwatar, Ward 4',
                        'municipality' => $raw['municipality'] ?? $raw['city'] ?? 'Kathmandu Metropolitan City',
                        'district' => $raw['district'] ?? 'Kathmandu',
                        'province' => $raw['province'] ?? 'Bagmati Province',
                        'landmark' => $raw['landmark'] ?? null,
                    ];
                }
            } elseif ($this->order->shippingAddress) {
                $sa = $this->order->shippingAddress;
                $shipping = [
                    'name' => $sa->full_name ?? $sa->name ?? ($this->order->user?->full_name ?? 'Customer'),
                    'phone' => $sa->phone ?? $this->order->user?->phone ?? '9800000000',
                    'street' => $sa->address_line_1 ?? $sa->street ?? 'Main Road',
                    'municipality' => $sa->municipality ?? $sa->city ?? 'Biratnagar',
                    'district' => $sa->district ?? 'Morang',
                    'province' => $sa->province ?? 'Koshi Province',
                ];
            } elseif ($this->order->user) {
                $u = $this->order->user;
                $shipping = [
                    'name' => $u->full_name ?? ($u->first_name . ' ' . $u->last_name),
                    'phone' => $u->phone ?? '9800000000',
                    'street' => 'Main Road, Ward 4',
                    'municipality' => 'Biratnagar',
                    'district' => 'Morang',
                    'province' => 'Koshi Province',
                ];
            }
        }

        return [
            'id' => $this->uuid,
            'vendor_order_number' => $this->vendor_order_number,
            'vendor_id' => $this->vendor?->uuid,
            'vendor_name' => $this->vendor?->company_name,
            'store_id' => $this->store?->uuid,
            'store_name' => $this->store?->name,
            'status' => $this->status->value,
            'delivery_status' => $this->delivery_status->value,
            'items_subtotal' => number_format((float) $this->items_subtotal, 2, '.', ''),
            'delivery_charge' => number_format((float) $this->delivery_charge, 2, '.', ''),
            'tax' => number_format((float) $this->tax, 2, '.', ''),
            'grand_total' => number_format((float) $this->grand_total, 2, '.', ''),
            'commission_rate' => (float) $this->commission_rate,
            'commission_amount' => number_format((float) $this->commission_amount, 2, '.', ''),
            'vendor_payable' => number_format((float) $this->vendor_payable, 2, '.', ''),
            'shipping_address' => $shipping,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
