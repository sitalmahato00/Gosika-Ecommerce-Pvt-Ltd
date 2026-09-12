<?php

namespace App\Modules\Shipping\Presentation\Resources;

use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DispatchItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $vendorOrder = $this->resource;
        $order = $vendorOrder->order ?? $vendorOrder->order()->first();
        $user = $order?->user;
        $store = $vendorOrder->store ?? $vendorOrder->store()->first();
        $assignment = $vendorOrder->latestAssignment ?? $vendorOrder->latestAssignment()->first();
        $partner = $assignment?->deliveryPartner;

        $isCod = $order !== null && strcasecmp((string) $order->payment_method, PaymentMethod::COD->value) === 0;
        $dispatchStatus = $assignment?->status->value ?? 'pending_assignment';

        $area = $this->deliveryArea($order);
        $packageCount = $vendorOrder->package_count ?? $vendorOrder->items_count ?? $vendorOrder->items->count();

        return [
            'id' => $vendorOrder->uuid,
            'vendor_order_number' => $vendorOrder->vendor_order_number,
            'vendor_order_status' => $vendorOrder->status->value,
            'delivery_status' => $vendorOrder->delivery_status->value,
            'dispatch_status' => $dispatchStatus,
            'package_count' => $packageCount,
            'order' => [
                'id' => $order?->id,
                'order_number' => $order?->order_number,
                'placed_at' => $order?->placed_at?->toISOString() ?? $order?->created_at?->toISOString(),
                'order_status' => $order?->status?->value,
                'payment_status' => $order?->payment_status?->value,
                'payment_method' => $order?->payment_method,
                'grand_total' => $order !== null ? number_format((float) $order->grand_total, 2, '.', '') : '0.00',
            ],
            'customer' => [
                'full_name' => $user?->full_name,
                'phone' => $user?->phone,
            ],
            'recipient' => [
                'full_name' => $assignment?->recipient_name ?? $this->snapshotRecipient($order, $user),
                'phone' => $assignment?->recipient_phone ?? $this->snapshotPhone($order, $user),
            ],
            'store' => [
                'id' => $store?->uuid,
                'name' => $store?->name,
            ],
            'delivery_area' => $area,
            'payment' => [
                'method' => $order?->payment_method,
                'status' => $order?->payment_status?->value,
                'is_cod' => $isCod,
            ],
            'amount' => $order !== null ? number_format((float) $order->grand_total, 2, '.', '') : '0.00',
            'cod_amount' => $assignment?->cod_amount !== null && $assignment?->cod_amount > 0
                ? number_format((float) $assignment->cod_amount, 2, '.', '')
                : ($isCod && $order !== null ? number_format((float) $order->grand_total, 2, '.', '') : '0.00'),
            'delivery_fee' => $assignment?->delivery_fee !== null
                ? number_format((float) $assignment->delivery_fee, 2, '.', '')
                : number_format((float) ($vendorOrder->delivery_charge ?? 0), 2, '.', ''),
            'assignment' => $assignment ? [
                'id' => $assignment->uuid,
                'status' => $assignment->status->value,
                'failure_reason' => $assignment->failure_reason,
                'meta' => $assignment->meta,
                'assigned_at' => $assignment->assigned_at?->toISOString(),
                'accepted_at' => $assignment->accepted_at?->toISOString(),
                'picked_up_at' => $assignment->picked_up_at?->toISOString(),
                'out_for_delivery_at' => $assignment->out_for_delivery_at?->toISOString(),
                'delivered_at' => $assignment->delivered_at?->toISOString(),
                'failed_at' => $assignment->failed_at?->toISOString(),
            ] : null,
            'delivery_partner' => $partner ? [
                'id' => $partner->uuid,
                'name' => $partner->name,
                'phone' => $partner->phone,
                'vehicle_type' => $partner->vehicle_type,
                'status' => $partner->status->value,
                'is_online' => (bool) $partner->is_online,
                'rating_avg' => (float) $partner->rating_avg,
            ] : null,
            'assigned_at' => $assignment?->assigned_at?->toISOString(),
            'last_updated' => $assignment?->updated_at?->toISOString() ?? $vendorOrder->updated_at?->toISOString(),
            'can_assign' => $dispatchStatus === 'pending_assignment'
                && in_array($vendorOrder->status->value, [
                    'accepted',
                    'preparing',
                    'ready_for_pickup',
                ], true),
            'can_reassign' => $assignment !== null && in_array($assignment->status, [
                DeliveryStatus::ASSIGNED,
                DeliveryStatus::ACCEPTED,
                DeliveryStatus::PICKED_UP,
                DeliveryStatus::OUT_FOR_DELIVERY,
                DeliveryStatus::FAILED,
            ], true),
        ];
    }

    protected function deliveryArea($order): array
    {
        $snapshot = $order ? json_decode((string) $order->shipping_address_snapshot, true) : null;

        if (! is_array($snapshot)) {
            return [];
        }

        return array_filter([
            'province' => $snapshot['province'] ?? $snapshot['state'] ?? null,
            'district' => $snapshot['district'] ?? $snapshot['city'] ?? null,
            'municipality' => $snapshot['municipality'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');
    }

    protected function snapshotRecipient($order, $user): ?string
    {
        $snapshot = $order ? json_decode((string) $order->shipping_address_snapshot, true) : null;

        if (is_array($snapshot) && ! empty($snapshot['full_name'])) {
            return $snapshot['full_name'];
        }

        return $user?->full_name;
    }

    protected function snapshotPhone($order, $user): ?string
    {
        $snapshot = $order ? json_decode((string) $order->shipping_address_snapshot, true) : null;

        if (is_array($snapshot) && ! empty($snapshot['phone'])) {
            return $snapshot['phone'];
        }

        return $user?->phone;
    }
}