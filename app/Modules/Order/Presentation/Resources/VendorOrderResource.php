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

        $activeAssignment = $this->relationLoaded('assignments')
            ? ($this->assignments->first(fn ($a) => in_array($a->status?->value ?? $a->status, ['assigned', 'accepted', 'picked_up', 'out_for_delivery'], true)) ?: $this->assignments->first())
            : null;

        $placedAt = \Carbon\Carbon::parse($this->order?->placed_at ?? $this->order?->created_at ?? $this->created_at);
        $cancellationWindowMins = (int) \App\Modules\Platform\Infrastructure\Models\Setting::get('order.cancellation_window_minutes', 15);
        $cancellationEndsAt = $placedAt->copy()->addMinutes($cancellationWindowMins);

        $deadlineHours = (int) \App\Modules\Platform\Infrastructure\Models\Setting::get('order.vendor_confirmation_deadline_hours', 24);
        $deadline = $placedAt->copy()->addHours($deadlineHours);

        $now = now();
        $isPending = $this->status === \App\Modules\Shared\Domain\Enums\OrderStatus::PENDING;
        $inCancellationWindow = $isPending && $now->lessThan($cancellationEndsAt);
        $isPastDeadline = $isPending && $now->greaterThanOrEqualTo($deadline);
        $canConfirm = $isPending && ! $inCancellationWindow && ! $isPastDeadline;

        $confirmationBlockedReason = null;
        if ($inCancellationWindow) {
            $remainingMins = (int) ceil($now->diffInSeconds($cancellationEndsAt) / 60);
            $confirmationBlockedReason = "Customer cancellation window is active ({$remainingMins}m remaining).";
        } elseif ($isPastDeadline) {
            $confirmationBlockedReason = "Vendor confirmation deadline ({$deadlineHours}h) has expired.";
        } elseif (! $isPending) {
            $confirmationBlockedReason = "Order is no longer in pending status.";
        }

        $cancellationRemaining = $inCancellationWindow ? max(0, $now->diffInSeconds($cancellationEndsAt, false)) : 0;
        $deadlineRemaining = ($isPending && ! $isPastDeadline) ? max(0, $now->diffInSeconds($deadline, false)) : 0;

        $store = $this->store ?? $this->vendor?->stores()->first();
        $storeSettings = (array) ($store?->settings ?? []);
        $storeAuto = ($storeSettings['order_confirmation_mode'] ?? 'manual') === 'automatic';
        $platformAutoEnabled = (bool) \App\Modules\Platform\Infrastructure\Models\Setting::get('order.auto_confirmation_enabled', false);
        $autoConfirmationEnabled = $storeAuto || $platformAutoEnabled;

        $storeAutoMins = isset($storeSettings['auto_confirmation_minutes'])
            ? (int) $storeSettings['auto_confirmation_minutes']
            : (int) \App\Modules\Platform\Infrastructure\Models\Setting::get('order.auto_confirmation_minutes', 30);
        $effectiveAutoMins = max($storeAutoMins, $cancellationWindowMins);
        $autoConfirmationAt = $autoConfirmationEnabled ? $placedAt->copy()->addMinutes($effectiveAutoMins) : null;
        $autoRemaining = ($autoConfirmationEnabled && $isPending && $autoConfirmationAt && $now->lessThan($autoConfirmationAt))
            ? max(0, $now->diffInSeconds($autoConfirmationAt, false))
            : null;

        $meta = is_array($this->meta) ? $this->meta : [];

        return [
            'id' => $this->uuid,
            'order_id' => $this->order?->uuid,
            'order_number' => $this->order?->order_number,
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
            'assignment' => $activeAssignment ? new \App\Modules\Shipping\Presentation\Resources\DeliveryAssignmentResource($activeAssignment) : null,
            'assignments' => \App\Modules\Shipping\Presentation\Resources\DeliveryAssignmentResource::collection($this->whenLoaded('assignments')),
            'created_at' => $this->created_at?->toISOString(),
            // Vendor Confirmation Lifecycle Properties
            'can_confirm' => $canConfirm,
            'in_cancellation_window' => $inCancellationWindow,
            'confirmation_blocked_reason' => $confirmationBlockedReason,
            'cancellation_window_ends_at' => $cancellationEndsAt->toISOString(),
            'cancellation_window_seconds_remaining' => (int) $cancellationRemaining,
            'confirmation_deadline' => $deadline->toISOString(),
            'confirmation_deadline_seconds_remaining' => (int) $deadlineRemaining,
            'auto_confirmation_enabled' => $platformAutoEnabled,
            'auto_confirmation_at' => $autoConfirmationAt?->toISOString(),
            'auto_confirmation_seconds_remaining' => $autoRemaining !== null ? (int) $autoRemaining : null,
            'confirmation_method' => $meta['confirmation_method'] ?? null,
            'confirmed_at' => $meta['confirmed_at'] ?? null,
        ];
    }
}
