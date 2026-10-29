<?php

namespace App\Modules\Shipping\Presentation\Resources;

use App\Modules\Shared\Domain\Enums\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvailableJobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $vendorOrder = $this->resource;
        $order = $vendorOrder->order;
        $store = $vendorOrder->store;
        $isPaid = $order?->payment_status?->value === 'paid';
        $isCod = ! $isPaid && (
            strcasecmp((string) $order?->payment_method, PaymentMethod::COD->value) === 0
            || stripos((string) $order?->payment_method, 'cod') !== false
            || stripos((string) $order?->payment_method, 'cash') !== false
        );

        $snapshot = json_decode((string) $order?->shipping_address_snapshot, true) ?: [];
        $deliveryArea = array_filter([
            'municipality' => $snapshot['municipality'] ?? null,
            'district' => $snapshot['district'] ?? $snapshot['city'] ?? null,
            'province' => $snapshot['province'] ?? $snapshot['state'] ?? null,
        ]);

        $dropoffDestination = implode(', ', array_filter([
            $snapshot['address_line_1'] ?? null,
            $snapshot['address_line_2'] ?? null,
            $snapshot['municipality'] ?? null,
            $snapshot['district'] ?? null,
            $snapshot['province'] ?? null,
        ]));

        $pickupAddress = '';
        if ($store) {
            $parts = [$store->name];
            $storeAddress = $store->addresses()->first();
            if ($storeAddress && $storeAddress->address_line_1) {
                $parts[] = $storeAddress->address_line_1;
            }
            $pickupAddress = implode(', ', array_filter($parts));
        }

        $itemsSummary = $vendorOrder->items->map(function ($item) {
            return $item->quantity . 'x ' . $item->product_name;
        })->join(', ');

        return [
            'id' => $vendorOrder->uuid,
            'vendor_order_number' => $vendorOrder->vendor_order_number,
            'status' => $vendorOrder->status->value,
            'readiness_status' => 'ready_for_pickup',
            'readiness_label' => 'Ready for Pickup',
            'pickup' => [
                'store_name' => $store?->name ?? 'Marketplace Store',
                'address' => $pickupAddress,
                'phone' => $store?->phone,
            ],
            'dropoff' => [
                'destination' => $dropoffDestination ?: 'Delivery Address',
                'delivery_area' => $deliveryArea,
            ],
            'package' => [
                'item_count' => $vendorOrder->items->count(),
                'total_quantity' => (int) $vendorOrder->items->sum('quantity'),
                'items_summary' => $itemsSummary ?: 'Package items',
            ],
            'payment' => [
                'is_cod' => $isCod,
                'payment_method' => $order?->payment_method ?? 'Prepaid',
                'cod_amount' => $isCod ? (float) ($vendorOrder->grand_total ?: $order?->grand_total ?? 0) : 0.00,
            ],
            'delivery_fee' => (float) ($vendorOrder->delivery_charge ?: $order?->delivery_charge ?? 0),
            'ready_at' => $vendorOrder->updated_at?->toISOString(),
            'created_at' => $vendorOrder->created_at?->toISOString(),
        ];
    }
}
