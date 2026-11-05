<?php

namespace App\Modules\Shipping\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DeliveryAssignmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $safeMeta = (array) ($this->meta ?? []);
        unset($safeMeta['delivery_otp']);

        $dropoffCoords = null;
        $order = $this->vendorOrder?->order;
        if ($order && $order->shipping_address_snapshot) {
            $shippingSnap = is_array($order->shipping_address_snapshot)
                ? $order->shipping_address_snapshot
                : json_decode((string) $order->shipping_address_snapshot, true);
            if (! empty($shippingSnap['latitude']) && ! empty($shippingSnap['longitude'])) {
                $dropoffCoords = [
                    'lat' => (float) $shippingSnap['latitude'],
                    'lng' => (float) $shippingSnap['longitude'],
                ];
            }
        }

        $pickupCoords = null;
        $vendor = $this->vendorOrder?->vendor;
        if ($vendor) {
            if ($vendor->relationLoaded('stores') && $vendor->stores->isNotEmpty()) {
                $store = $vendor->stores->first();
                $storeAddress = $store->relationLoaded('address') ? $store->address : $store->address()->first();
                if ($storeAddress && ! empty($storeAddress->latitude) && ! empty($storeAddress->longitude)) {
                    $pickupCoords = [
                        'lat' => (float) $storeAddress->latitude,
                        'lng' => (float) $storeAddress->longitude,
                    ];
                }
            }
            if (! $pickupCoords && $vendor->relationLoaded('kyc') && $vendor->kyc) {
                if (! empty($vendor->kyc->latitude) && ! empty($vendor->kyc->longitude)) {
                    $pickupCoords = [
                        'lat' => (float) $vendor->kyc->latitude,
                        'lng' => (float) $vendor->kyc->longitude,
                    ];
                }
            }
        }

        $riderCoords = null;
        if ($this->deliveryPartner && $this->deliveryPartner->latitude && $this->deliveryPartner->longitude) {
            $riderCoords = [
                'lat' => (float) $this->deliveryPartner->latitude,
                'lng' => (float) $this->deliveryPartner->longitude,
            ];
        }

        return [
            'id' => $this->uuid,
            'vendor_order_id' => $this->vendorOrder?->uuid,
            'vendor_order_number' => $this->vendorOrder?->vendor_order_number,
            'delivery_partner_id' => $this->deliveryPartner?->uuid,
            'delivery_partner_name' => $this->deliveryPartner?->name,
            'delivery_partner' => new DeliveryPartnerResource($this->whenLoaded('deliveryPartner')),
            'status' => $this->status->value,
            'delivery_fee' => number_format((float) $this->delivery_fee, 2, '.', ''),
            'cod_amount' => number_format((float) $this->cod_amount, 2, '.', ''),
            'pickup_address' => $this->pickup_address,
            'dropoff_address' => $this->dropoff_address,
            'pickup_coordinates' => $pickupCoords,
            'dropoff_coordinates' => $dropoffCoords,
            'rider_coordinates' => $riderCoords,
            'recipient_name' => $this->recipient_name,
            'recipient_phone' => $this->recipient_phone,
            'assigned_at' => $this->assigned_at?->toISOString(),
            'accepted_at' => $this->accepted_at?->toISOString(),
            'picked_up_at' => $this->picked_up_at?->toISOString(),
            'out_for_delivery_at' => $this->out_for_delivery_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'failed_at' => $this->failed_at?->toISOString(),
            'failure_reason' => $this->failure_reason,
            'proof_photo' => $this->proof_photo,
            'assignment_method' => $this->meta['assignment_method'] ?? 'manual_admin',
            'assignment_method_label' => ($this->meta['assignment_method'] ?? '') === 'self_claim' ? 'Delivery-User Claim' : 'Super Admin Manual Assignment',
            'assigned_by' => $this->meta['assigned_by_name'] ?? null,
            'assigned_by_role' => $this->meta['assigned_by_role'] ?? null,
            'reassignment_reason' => $this->meta['reassignment_reason'] ?? null,
            'meta' => $safeMeta,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'tracking' => DeliveryTrackingResource::collection($this->whenLoaded('tracking')),
            'vendor_order' => $this->whenLoaded('vendorOrder'),
        ];
    }
}
