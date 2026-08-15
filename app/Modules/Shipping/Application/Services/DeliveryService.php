<?php

namespace App\Modules\Shipping\Application\Services;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderStatusHistory;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\DeliveryPartnerStatus;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Enums\StockStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shipping\Application\DataTransferObjects\ApplyDeliveryPartnerDTO;
use App\Modules\Shipping\Application\DataTransferObjects\UpdateDeliveryPartnerProfileDTO;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Shipping\Infrastructure\Models\DeliveryTracking;
use App\Modules\Catalog\Infrastructure\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DeliveryService
{
    private const OTP_TTL_SECONDS = 1800;
    private const OTP_MAX_ATTEMPTS = 5;

    public function apply(User $user, ApplyDeliveryPartnerDTO $dto): DeliveryPartner
    {
        if ($user->deliveryPartner()->exists()) {
            throw new DomainException('A delivery partner application already exists for this account.');
        }

        return DeliveryPartner::query()->create([
            'user_id' => $user->id,
            'name' => $dto->name,
            'phone' => $dto->phone,
            'email' => $dto->email,
            'vehicle_type' => $dto->vehicle_type,
            'vehicle_number' => $dto->vehicle_number,
            'service_areas' => $dto->service_areas,
            'latitude' => $dto->latitude,
            'longitude' => $dto->longitude,
            'status' => DeliveryPartnerStatus::PENDING,
            'is_online' => false,
        ]);
    }

    public function updateProfile(User $user, UpdateDeliveryPartnerProfileDTO $dto): DeliveryPartner
    {
        $partner = $this->partnerFor($user);

        if ($partner->status === DeliveryPartnerStatus::SUSPENDED) {
            throw new DomainException('Suspended delivery partners cannot update their profile.');
        }

        $partner->update(array_filter([
            'name' => $dto->name,
            'email' => $dto->email,
            'vehicle_type' => $dto->vehicle_type,
            'vehicle_number' => $dto->vehicle_number,
            'service_areas' => $dto->service_areas,
            'latitude' => $dto->latitude,
            'longitude' => $dto->longitude,
        ], fn ($value) => $value !== null));

        return $partner;
    }

    public function setOnline(User $user, bool $isOnline): DeliveryPartner
    {
        $partner = $this->partnerFor($user);

        if ($partner->status !== DeliveryPartnerStatus::APPROVED) {
            throw new DomainException('Only approved delivery partners can set availability.', 403);
        }

        $partner->update(['is_online' => $isOnline]);

        return $partner;
    }

    public function approve(User $admin, DeliveryPartner $partner): DeliveryPartner
    {
        if ($partner->status === DeliveryPartnerStatus::APPROVED) {
            throw new DomainException('Delivery partner is already approved.');
        }

        DB::transaction(function () use ($admin, $partner) {
            $partner->update([
                'status' => DeliveryPartnerStatus::APPROVED,
                'approved_by' => $admin->id,
                'approved_at' => now(),
            ]);

            if (! $partner->user->hasRole(Roles::DELIVERY_PARTNER)) {
                $partner->user->assignRole(Roles::DELIVERY_PARTNER);
            }
        });

        return $partner;
    }

    public function reject(User $admin, DeliveryPartner $partner, string $reason): DeliveryPartner
    {
        if (! $reason) {
            throw new DomainException('A rejection reason is required.');
        }

        $partner->update([
            'status' => DeliveryPartnerStatus::INACTIVE,
            'approved_by' => $admin->id,
            'approved_at' => now(),
            'meta' => array_merge($partner->meta ?? [], ['rejection_reason' => $reason]),
        ]);

        return $partner;
    }

    public function suspend(User $admin, DeliveryPartner $partner, ?string $reason): DeliveryPartner
    {
        $partner->update([
            'status' => DeliveryPartnerStatus::SUSPENDED,
            'is_online' => false,
            'meta' => array_merge($partner->meta ?? [], ['suspension_reason' => $reason]),
        ]);

        return $partner;
    }

    public function activate(User $admin, DeliveryPartner $partner): DeliveryPartner
    {
        if ($partner->status !== DeliveryPartnerStatus::SUSPENDED) {
            throw new DomainException('Only suspended delivery partners can be activated.');
        }

        $partner->update([
            'status' => DeliveryPartnerStatus::APPROVED,
            'approved_at' => $partner->approved_at ?? now(),
        ]);

        return $partner;
    }

    public function assign(
        User $admin,
        VendorOrder $vendorOrder,
        DeliveryPartner $partner,
        ?float $deliveryFee = null,
        ?float $codAmount = null,
    ): DeliveryAssignment {
        return DB::transaction(function () use ($admin, $vendorOrder, $partner, $deliveryFee, $codAmount) {
            if ($partner->status !== DeliveryPartnerStatus::APPROVED) {
                throw new DomainException('Only approved delivery partners can be assigned.');
            }

            if (! in_array($vendorOrder->status, [
                OrderStatus::ACCEPTED,
                OrderStatus::PREPARING,
                OrderStatus::READY_FOR_PICKUP,
            ], true)) {
                throw new DomainException('Vendor order must be accepted and ready for pickup before assignment.', 422);
            }

            if ($vendorOrder->assignments()->active()->exists()) {
                throw new DomainException('This vendor order already has an active delivery assignment.');
            }

            $order = $vendorOrder->order;
            $isCod = $order->payment_method === PaymentMethod::COD->value;

            $assignment = DeliveryAssignment::query()->create([
                'vendor_order_id' => $vendorOrder->id,
                'delivery_partner_id' => $partner->id,
                'status' => DeliveryStatus::ASSIGNED,
                'delivery_fee' => $deliveryFee ?? (float) $vendorOrder->delivery_charge,
                'cod_amount' => $codAmount ?? ($isCod ? (float) $vendorOrder->grand_total : 0.00),
                'pickup_address' => $this->pickupAddressFor($vendorOrder),
                'dropoff_address' => $this->dropoffAddressFor($order),
                'recipient_name' => $this->recipientNameFor($order),
                'recipient_phone' => $this->recipientPhoneFor($order),
                'assigned_at' => now(),
            ]);

            if (in_array($vendorOrder->status, [OrderStatus::ACCEPTED, OrderStatus::PREPARING], true)) {
                $this->transitionVendorOrder($vendorOrder, OrderStatus::READY_FOR_PICKUP, $admin);
            }

            $this->transitionDelivery($vendorOrder, DeliveryStatus::ASSIGNED, $admin);

            $this->recordTracking($assignment, DeliveryStatus::ASSIGNED, 'Order assigned to delivery partner.', null);

            return $assignment;
        });
    }

    public function reassign(User $admin, DeliveryAssignment $assignment, DeliveryPartner $newPartner): DeliveryAssignment
    {
        return DB::transaction(function () use ($admin, $assignment, $newPartner) {
            if (! in_array($assignment->status, [DeliveryStatus::ASSIGNED, DeliveryStatus::ACCEPTED, DeliveryStatus::PICKED_UP, DeliveryStatus::OUT_FOR_DELIVERY, DeliveryStatus::FAILED], true)) {
                throw new DomainException('This delivery cannot be reassigned in its current state.');
            }

            if ($newPartner->status !== DeliveryPartnerStatus::APPROVED) {
                throw new DomainException('Only approved delivery partners can be assigned.');
            }

            $vendorOrder = $assignment->vendorOrder;

            if (! in_array($vendorOrder->status, [OrderStatus::ACCEPTED, OrderStatus::PREPARING, OrderStatus::READY_FOR_PICKUP], true)) {
                throw new DomainException('Vendor order is no longer assignable.', 422);
            }

            $assignment->update([
                'status' => DeliveryStatus::FAILED,
                'failed_at' => $assignment->failed_at ?? now(),
                'failure_reason' => 'Reassigned to another delivery partner.',
            ]);

            $this->recordTracking($assignment, DeliveryStatus::FAILED, 'Reassigned to another delivery partner.', null);

            return $this->assign($admin, $vendorOrder, $newPartner);
        });
    }

    public function accept(User $partnerUser, DeliveryAssignment $assignment): DeliveryAssignment
    {
        $this->assertPartnerOwns($partnerUser, $assignment);
        $this->assertStatus($assignment, [DeliveryStatus::ASSIGNED], 'Only assigned deliveries can be accepted.');

        $assignment->update([
            'status' => DeliveryStatus::ACCEPTED,
            'accepted_at' => now(),
        ]);

        $this->transitionDelivery($assignment->vendorOrder, DeliveryStatus::ACCEPTED, $partnerUser);
        $this->recordTracking($assignment, DeliveryStatus::ACCEPTED, 'Delivery accepted by partner.', null);

        return $assignment->fresh(['tracking']);
    }

    public function pickup(User $partnerUser, DeliveryAssignment $assignment): DeliveryAssignment
    {
        $this->assertPartnerOwns($partnerUser, $assignment);
        $this->assertStatus($assignment, [DeliveryStatus::ACCEPTED], 'Delivery must be accepted before pickup.');

        $assignment->update([
            'status' => DeliveryStatus::PICKED_UP,
            'picked_up_at' => now(),
        ]);

        $this->transitionVendorOrder($assignment->vendorOrder, OrderStatus::PICKED_UP, $partnerUser);
        $this->transitionDelivery($assignment->vendorOrder, DeliveryStatus::PICKED_UP, $partnerUser);
        $this->recordTracking($assignment, DeliveryStatus::PICKED_UP, 'Order picked up from vendor.', null);

        return $assignment->fresh(['tracking']);
    }

    public function outForDelivery(User $partnerUser, DeliveryAssignment $assignment): array
    {
        $this->assertPartnerOwns($partnerUser, $assignment);
        $this->assertStatus($assignment, [DeliveryStatus::PICKED_UP], 'Delivery must be picked up before heading out.');

        $assignment->update([
            'status' => DeliveryStatus::OUT_FOR_DELIVERY,
            'out_for_delivery_at' => now(),
        ]);

        $this->transitionVendorOrder($assignment->vendorOrder, OrderStatus::OUT_FOR_DELIVERY, $partnerUser);
        $this->transitionDelivery($assignment->vendorOrder, DeliveryStatus::OUT_FOR_DELIVERY, $partnerUser);
        $this->recordTracking($assignment, DeliveryStatus::OUT_FOR_DELIVERY, 'Order is out for delivery.', null);

        $otp = $this->generateOtp($assignment);

        return [$assignment->fresh(['tracking']), $otp];
    }

    public function deliver(User $partnerUser, DeliveryAssignment $assignment, string $otp): DeliveryAssignment
    {
        $this->assertPartnerOwns($partnerUser, $assignment);
        $this->assertStatus($assignment, [DeliveryStatus::OUT_FOR_DELIVERY], 'Delivery must be out for delivery before confirmation.');

        if (! $this->verifyOtp($assignment, $otp)) {
            throw new DomainException('Invalid or expired delivery OTP.', 422);
        }

        return DB::transaction(function () use ($partnerUser, $assignment) {
            $assignment->update([
                'status' => DeliveryStatus::DELIVERED,
                'delivered_at' => now(),
            ]);

            $vendorOrder = $assignment->vendorOrder;
            $this->transitionVendorOrder($vendorOrder, OrderStatus::DELIVERED, $partnerUser);
            $this->transitionDelivery($vendorOrder, DeliveryStatus::DELIVERED, $partnerUser);
            $this->recordTracking($assignment, DeliveryStatus::DELIVERED, 'Order delivered and confirmed by customer OTP.', null);

            $order = $vendorOrder->order;
            if ($order->payment_method === PaymentMethod::COD->value && $order->payment_status !== OrderPaymentStatus::PAID) {
                $order->update(['payment_status' => OrderPaymentStatus::PAID]);
                $this->logStatus($order, $order->status->value, $order->status->value, $partnerUser, 'COD amount collected on delivery.');
            }

            $this->syncOrder($order, $partnerUser);

            return $assignment->fresh(['tracking']);
        });
    }

    public function fail(User $partnerUser, DeliveryAssignment $assignment, string $reason): DeliveryAssignment
    {
        $this->assertPartnerOwns($partnerUser, $assignment);

        if (! $reason) {
            throw new DomainException('A failure reason is required.');
        }

        $this->assertStatus($assignment, [
            DeliveryStatus::ACCEPTED,
            DeliveryStatus::PICKED_UP,
            DeliveryStatus::OUT_FOR_DELIVERY,
        ], 'Delivery cannot be marked failed in its current state.');

        $assignment->update([
            'status' => DeliveryStatus::FAILED,
            'failed_at' => now(),
            'failure_reason' => $reason,
        ]);

        $this->transitionDelivery($assignment->vendorOrder, DeliveryStatus::FAILED, $partnerUser);
        $this->recordTracking($assignment, DeliveryStatus::FAILED, $reason, null);

        return $assignment->fresh(['tracking']);
    }

    public function returnToVendor(User $partnerUser, DeliveryAssignment $assignment, ?string $reason = null): DeliveryAssignment
    {
        $this->assertPartnerOwns($partnerUser, $assignment);
        $this->assertStatus($assignment, [DeliveryStatus::FAILED], 'Only failed deliveries can be returned to the vendor.');

        $assignment->update([
            'status' => DeliveryStatus::RETURNED_TO_VENDOR,
            'failure_reason' => $reason ?: $assignment->failure_reason,
        ]);

        $this->transitionVendorOrder($assignment->vendorOrder, OrderStatus::RETURNED, $partnerUser);
        $this->transitionDelivery($assignment->vendorOrder, DeliveryStatus::RETURNED_TO_VENDOR, $partnerUser);
        $this->recordTracking($assignment, DeliveryStatus::RETURNED_TO_VENDOR, $reason ?: 'Order returned to vendor.', null);

        $this->restoreStock($assignment->vendorOrder);
        $this->syncOrder($assignment->vendorOrder->order, $partnerUser);

        return $assignment->fresh(['tracking']);
    }

    public function trackingForOrder(Order $order): Collection
    {
        return $order->vendorOrders()
            ->with('assignments.tracking')
            ->get()
            ->flatMap(fn (VendorOrder $vendorOrder) => $vendorOrder->assignments->flatMap(fn ($assignment) => $assignment->tracking))
            ->sortByDesc('tracked_at')
            ->values();
    }

    public function vendorAccept(VendorOrder $vendorOrder, User $actor): VendorOrder
    {
        if ($vendorOrder->status !== OrderStatus::PENDING) {
            throw new DomainException('Only pending vendor orders can be accepted.', 422);
        }

        $this->transitionVendorOrder($vendorOrder, OrderStatus::ACCEPTED, $actor);

        return $vendorOrder;
    }

    public function vendorReject(VendorOrder $vendorOrder, User $actor, string $reason): VendorOrder
    {
        if ($vendorOrder->status !== OrderStatus::PENDING) {
            throw new DomainException('Only pending vendor orders can be rejected.', 422);
        }

        if (! $reason) {
            throw new DomainException('A rejection reason is required.');
        }

        DB::transaction(function () use ($vendorOrder, $actor, $reason) {
            $this->transitionVendorOrder($vendorOrder, OrderStatus::REJECTED, $actor);
            $this->restoreStock($vendorOrder);
            $this->syncOrder($vendorOrder->order, $actor);
        });

        return $vendorOrder;
    }

    public function markReadyForPickup(VendorOrder $vendorOrder, User $actor): VendorOrder
    {
        if (! in_array($vendorOrder->status, [OrderStatus::ACCEPTED, OrderStatus::PREPARING], true)) {
            throw new DomainException('Only accepted vendor orders can be marked ready for pickup.', 422);
        }

        $this->transitionVendorOrder($vendorOrder, OrderStatus::READY_FOR_PICKUP, $actor);

        return $vendorOrder;
    }

    protected function partnerFor(User $user): DeliveryPartner
    {
        $partner = $user->deliveryPartner;

        if (! $partner) {
            throw new DomainException('No delivery partner profile found for this account.', 404);
        }

        return $partner;
    }

    protected function assertPartnerOwns(User $user, DeliveryAssignment $assignment): DeliveryPartner
    {
        $partner = $this->partnerFor($user);

        if ($assignment->delivery_partner_id !== $partner->id) {
            throw new DomainException('You do not have access to this delivery.', 403);
        }

        if ($partner->status !== DeliveryPartnerStatus::APPROVED) {
            throw new DomainException('Your delivery partner account is not active.', 403);
        }

        return $partner;
    }

    protected function assertStatus(DeliveryAssignment $assignment, array $allowed, string $message): void
    {
        if (! in_array($assignment->status, $allowed, true)) {
            throw new DomainException($message, 422);
        }
    }

    protected function transitionVendorOrder(VendorOrder $vendorOrder, OrderStatus $to, User $actor): void
    {
        $from = $vendorOrder->status->value;
        $vendorOrder->update(['status' => $to]);
        $this->logStatus($vendorOrder, $from, $to->value, $actor);
    }

    protected function transitionDelivery(VendorOrder $vendorOrder, DeliveryStatus $to, User $actor): void
    {
        $from = $vendorOrder->delivery_status->value;
        $vendorOrder->update(['delivery_status' => $to]);
        $this->logStatus($vendorOrder, $from, $to->value, $actor, 'Delivery status updated.');
    }

    protected function recordTracking(DeliveryAssignment $assignment, DeliveryStatus $status, ?string $note = null, ?array $coords = null): DeliveryTracking
    {
        return DeliveryTracking::query()->create([
            'assignment_id' => $assignment->id,
            'vendor_order_id' => $assignment->vendor_order_id,
            'status' => $status,
            'latitude' => $coords['latitude'] ?? null,
            'longitude' => $coords['longitude'] ?? null,
            'note' => $note,
            'tracked_at' => now(),
        ]);
    }

    protected function generateOtp(DeliveryAssignment $assignment): string
    {
        $code = (string) random_int(100000, 999999);

        Cache::put($this->otpKey($assignment), [
            'code' => hash('sha256', $code),
            'attempts' => 0,
        ], self::OTP_TTL_SECONDS);

        return $code;
    }

    protected function verifyOtp(DeliveryAssignment $assignment, string $code): bool
    {
        $key = $this->otpKey($assignment);
        $entry = Cache::get($key);

        if (! $entry) {
            return false;
        }

        if (($entry['attempts'] ?? 0) >= self::OTP_MAX_ATTEMPTS) {
            Cache::forget($key);
            return false;
        }

        if (hash_equals($entry['code'], hash('sha256', $code))) {
            Cache::forget($key);
            return true;
        }

        $entry['attempts'] = ($entry['attempts'] ?? 0) + 1;
        Cache::put($key, $entry, self::OTP_TTL_SECONDS);

        return false;
    }

    protected function otpKey(DeliveryAssignment $assignment): string
    {
        return 'delivery_otp:'.$assignment->uuid;
    }

    protected function logStatus(mixed $trackable, ?string $from, string $to, ?User $actor, ?string $reason = null): void
    {
        OrderStatusHistory::query()->create([
            'trackable_type' => $trackable::class,
            'trackable_id' => $trackable->id,
            'from_status' => $from,
            'to_status' => $to,
            'reason' => $reason,
            'actor_user_id' => $actor?->id,
        ]);
    }

    protected function syncOrder(Order $order, ?User $actor = null): void
    {
        $statuses = $order->vendorOrders()->pluck('status')->map(function ($status) {
            return $status instanceof OrderStatus ? $status->value : (string) $status;
        });

        if ($statuses->isEmpty()) {
            return;
        }

        $delivered = [OrderStatus::DELIVERED->value, OrderStatus::COMPLETED->value];
        $terminal = [OrderStatus::REJECTED->value, OrderStatus::CANCELLED->value, OrderStatus::RETURNED->value, OrderStatus::REFUNDED->value, OrderStatus::FAILED->value];

        if ($statuses->every(fn ($status) => in_array($status, $delivered, true))) {
            if ($order->status !== OrderStatus::DELIVERED) {
                $from = $order->status->value;
                $order->update([
                    'status' => OrderStatus::DELIVERED,
                    'completed_at' => $order->completed_at ?? now(),
                ]);
                $this->logStatus($order, $from, OrderStatus::DELIVERED->value, $actor, 'All vendor orders delivered.');
            }
        } elseif ($statuses->every(fn ($status) => in_array($status, $terminal, true))) {
            if ($order->status !== OrderStatus::CANCELLED) {
                $from = $order->status->value;
                $order->update([
                    'status' => OrderStatus::CANCELLED,
                    'cancelled_at' => $order->cancelled_at ?? now(),
                    'cancelled_reason' => $order->cancelled_reason ?? 'All vendor orders were cancelled or rejected.',
                ]);
                $this->logStatus($order, $from, OrderStatus::CANCELLED->value, $actor, 'All vendor orders terminal.');
            }
        }
    }

    protected function restoreStock(VendorOrder $vendorOrder): void
    {
        foreach ($vendorOrder->items as $item) {
            $product = Product::query()->find($item->product_id);

            if (! $product) {
                continue;
            }

            $product->increment('quantity', $item->quantity);

            if ($product->quantity > 0 && $product->stock_status === StockStatus::OUT_OF_STOCK) {
                $product->update(['stock_status' => StockStatus::IN_STOCK]);
            }
        }
    }

    protected function pickupAddressFor(VendorOrder $vendorOrder): string
    {
        $store = $vendorOrder->store;

        if (! $store) {
            return '';
        }

        $parts = [$store->name];
        $address = $store->addresses()->first();

        if ($address && $address->address_line_1) {
            $parts[] = $address->address_line_1;
        }

        return implode(', ', array_filter($parts));
    }

    protected function dropoffAddressFor(Order $order): string
    {
        $snapshot = json_decode((string) $order->shipping_address_snapshot, true);

        if (! is_array($snapshot)) {
            return '';
        }

        return implode(', ', array_filter([
            $snapshot['address_line_1'] ?? null,
            $snapshot['address_line_2'] ?? null,
            $snapshot['municipality'] ?? null,
            $snapshot['district'] ?? null,
            $snapshot['province'] ?? null,
        ]));
    }

    protected function recipientNameFor(Order $order): ?string
    {
        $snapshot = json_decode((string) $order->shipping_address_snapshot, true);

        if (is_array($snapshot) && ! empty($snapshot['full_name'])) {
            return $snapshot['full_name'];
        }

        return $order->user?->full_name;
    }

    protected function recipientPhoneFor(Order $order): ?string
    {
        $snapshot = json_decode((string) $order->shipping_address_snapshot, true);

        if (is_array($snapshot) && ! empty($snapshot['phone'])) {
            return $snapshot['phone'];
        }

        return $order->user?->phone;
    }
}
