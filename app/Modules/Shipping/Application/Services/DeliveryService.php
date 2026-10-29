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
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\StockStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shipping\Application\DataTransferObjects\ApplyDeliveryPartnerDTO;
use App\Modules\Shipping\Application\DataTransferObjects\UpdateDeliveryPartnerProfileDTO;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartnerDocument;
use App\Modules\Shipping\Infrastructure\Models\DeliveryTracking;
use App\Modules\Shipping\Infrastructure\Models\ShippingZone;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Catalog\Infrastructure\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use App\Modules\Marketing\Application\Services\NotificationDispatcher;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DeliveryService
{
    private const OTP_TTL_SECONDS = 1800;
    private const OTP_MAX_ATTEMPTS = 5;

    public function __construct(
        protected NotificationDispatcher $dispatcher,
    ) {
    }

    public function apply(User $user, ApplyDeliveryPartnerDTO $dto): DeliveryPartner
    {
        if ($user->deliveryPartner()->exists()) {
            throw new DomainException('A delivery partner application already exists for this account.');
        }

        $partner = DeliveryPartner::query()->create([
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

        $this->dispatcher->deliveryPartnerApplied($partner);

        return $partner;
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
            'vehicle_model' => $dto->vehicle_model,
            'vehicle_color' => $dto->vehicle_color,
            'vehicle_year' => $dto->vehicle_year,
            'insurance_expiry' => $dto->insurance_expiry,
            'service_areas' => $dto->service_areas,
            'latitude' => $dto->latitude,
            'longitude' => $dto->longitude,
        ], fn ($value) => $value !== null));

        return $partner;
    }

    public function addDocument(DeliveryPartner $partner, string $documentType, UploadedFile $file): DeliveryPartnerDocument
    {
        // Private disk: documents contain sensitive PII and must never be
        // served from /storage/. Access is gated through authenticated endpoints.
        $path = $file->store('delivery-documents/'.$partner->uuid, 'local');

        return DeliveryPartnerDocument::query()->create([
            'delivery_partner_id' => $partner->id,
            'document_type' => $documentType,
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'status' => 'pending',
        ]);
    }

    public function deleteDocument(DeliveryPartner $partner, DeliveryPartnerDocument $document): void
    {
        if ($document->delivery_partner_id !== $partner->id) {
            throw new DomainException('You do not have access to this document.', 403);
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();
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

    public function assignOrder(
        User $actor,
        VendorOrder $vendorOrder,
        DeliveryPartner $partner,
        string $method = 'manual_admin',
        ?float $deliveryFee = null,
        ?float $codAmount = null,
        ?string $notes = null,
        bool $withinReassignment = false,
    ): DeliveryAssignment {
        return DB::transaction(function () use ($actor, $vendorOrder, $partner, $method, $deliveryFee, $codAmount, $notes, $withinReassignment) {
            // Serialize concurrent assignment attempts for the same vendor order.
            // All assignment creation flows through this method, so pessimistic locking
            // prevents race conditions between two delivery users or admin assignment.
            $vendorOrder = VendorOrder::query()->whereKey($vendorOrder->getKey())->lockForUpdate()->firstOrFail();

            if ($partner->status !== DeliveryPartnerStatus::APPROVED) {
                throw new DomainException('Only approved delivery partners can be assigned.', 422);
            }

            if ($method === 'self_claim' && ! $partner->is_online) {
                throw new DomainException('You must be online to claim delivery jobs.', 422);
            }

            if (! $withinReassignment) {
                // Must be ready for pickup. Unprepared or unconfirmed orders cannot enter queue or be assigned.
                if (! in_array($vendorOrder->status, $this->assignableOrderStatuses(), true)) {
                    throw new DomainException('Vendor order must be marked ready for pickup before assignment.', 422);
                }

                if (in_array($vendorOrder->status, $this->terminalOrderStatuses(), true)) {
                    throw new DomainException('Vendor order is cancelled, delivered, or no longer eligible for delivery.', 422);
                }

                // Check for existing active assignment with pessimistic lock
                $activeAssignment = $vendorOrder->assignments()->active()->lockForUpdate()->first();
                if ($activeAssignment) {
                    if ($method === 'self_claim' && $activeAssignment->delivery_partner_id === $partner->id) {
                        return $activeAssignment; // Safe idempotent return for repeated claim requests
                    }

                    throw new DomainException(
                        $method === 'self_claim'
                            ? 'This shipment has already been claimed by another delivery partner.'
                            : 'This shipment has already been assigned. Use reassignment instead.',
                        409
                    );
                }
            }

            if ($method === 'self_claim') {
                $candidateAreas = $this->candidateAreasFor($vendorOrder);
                if (! $this->partnerMatchesAreas($partner, $candidateAreas)) {
                    throw new DomainException('This shipment is outside your approved delivery service areas.', 403);
                }
            }

            $order = $vendorOrder->order;
            $isPaid = $order->payment_status === OrderPaymentStatus::PAID;
            $isCod = ! $isPaid && (
                strcasecmp((string) $order->payment_method, PaymentMethod::COD->value) === 0
                || stripos((string) $order->payment_method, 'cod') !== false
                || stripos((string) $order->payment_method, 'cash') !== false
            );

            $defaultDeliveryFee = (float) $vendorOrder->delivery_charge ?: (float) ($order->delivery_charge ?? 0);
            $defaultCodAmount = $isCod ? ((float) $vendorOrder->grand_total ?: (float) ($order->grand_total ?? 0)) : 0.00;

            $meta = [
                'assignment_method' => $method,
                'assigned_by_user_id' => $actor->id,
                'assigned_by_name' => $actor->full_name ?? $actor->name ?? 'User',
                'assigned_by_role' => $method === 'self_claim' ? 'delivery_partner' : 'super_admin',
            ];
            if ($notes) {
                $meta['assignment_note'] = $notes;
            }

            // Ensure 6-digit delivery OTP is present and synced
            $deliveryOtp = $order->meta['delivery_otp']
                ?? $vendorOrder->meta['delivery_otp']
                ?? sprintf('%06d', random_int(100000, 999999));

            if (empty($order->meta['delivery_otp'])) {
                $orderMeta = (array) ($order->meta ?? []);
                $orderMeta['delivery_otp'] = $deliveryOtp;
                $order->meta = $orderMeta;
                $order->saveQuietly();
            }
            if (empty($vendorOrder->meta['delivery_otp'])) {
                $voMeta = (array) ($vendorOrder->meta ?? []);
                $voMeta['delivery_otp'] = $deliveryOtp;
                $vendorOrder->meta = $voMeta;
                $vendorOrder->saveQuietly();
            }

            $meta['delivery_otp'] = $deliveryOtp;

            $assignment = DeliveryAssignment::query()->create([
                'vendor_order_id' => $vendorOrder->id,
                'delivery_partner_id' => $partner->id,
                'status' => DeliveryStatus::ASSIGNED,
                'delivery_fee' => $deliveryFee !== null ? $deliveryFee : $defaultDeliveryFee,
                'cod_amount' => $codAmount !== null ? $codAmount : $defaultCodAmount,
                'pickup_address' => $this->pickupAddressFor($vendorOrder),
                'dropoff_address' => $this->dropoffAddressFor($order),
                'recipient_name' => $this->recipientNameFor($order),
                'recipient_phone' => $this->recipientPhoneFor($order),
                'assigned_at' => now(),
                'created_by' => $actor->id,
                'meta' => $meta,
            ]);

            Cache::put($this->otpKey($assignment), [
                'code' => hash('sha256', (string) $deliveryOtp),
                'attempts' => 0,
            ], 86400 * 7);

            $this->transitionDelivery($vendorOrder, DeliveryStatus::ASSIGNED, $actor);

            $trackingNote = $method === 'self_claim'
                ? 'Shipment claimed by delivery partner: ' . $partner->name
                : 'Order manually assigned to delivery partner: ' . $partner->name;

            $this->recordTracking($assignment, DeliveryStatus::ASSIGNED, $trackingNote, null);

            $auditAction = $method === 'self_claim' ? 'delivery.claimed' : 'delivery.assigned';

            $this->recordAudit($actor, $auditAction, 'delivery_assignment', $assignment, null, [
                'vendor_order' => $vendorOrder->uuid,
                'vendor_order_number' => $vendorOrder->vendor_order_number,
                'partner' => $partner->uuid,
                'partner_name' => $partner->name,
                'status' => DeliveryStatus::ASSIGNED->value,
                'method' => $method,
            ]);

            $this->dispatcher->deliveryAssigned($assignment);

            return $assignment;
        });
    }

    public function assign(
        User $admin,
        VendorOrder $vendorOrder,
        DeliveryPartner $partner,
        ?float $deliveryFee = null,
        ?float $codAmount = null,
        ?string $notes = null,
        bool $withinReassignment = false,
    ): DeliveryAssignment {
        return $this->assignOrder(
            actor: $admin,
            vendorOrder: $vendorOrder,
            partner: $partner,
            method: 'manual_admin',
            deliveryFee: $deliveryFee,
            codAmount: $codAmount,
            notes: $notes,
            withinReassignment: $withinReassignment,
        );
    }

    public function claim(
        User $partnerUser,
        VendorOrder $vendorOrder,
    ): DeliveryAssignment {
        $partner = $this->partnerFor($partnerUser);

        return $this->assignOrder(
            actor: $partnerUser,
            vendorOrder: $vendorOrder,
            partner: $partner,
            method: 'self_claim',
        );
    }

    public function reassign(
        User $admin,
        DeliveryAssignment $assignment,
        DeliveryPartner $newPartner,
        ?float $deliveryFee = null,
        ?float $codAmount = null,
        ?string $reason = null,
        ?string $notes = null,
    ): DeliveryAssignment {
        return DB::transaction(function () use ($admin, $assignment, $newPartner, $deliveryFee, $codAmount, $reason, $notes) {
            if (empty(trim((string) $reason))) {
                throw new DomainException('A reassignment reason is required.', 422);
            }

            // Ordinary reassignment is blocked after pickup
            if (in_array($assignment->status, [DeliveryStatus::PICKED_UP, DeliveryStatus::OUT_FOR_DELIVERY], true)) {
                throw new DomainException('Shipment has already been picked up. Ordinary reassignment is blocked after pickup.', 422);
            }

            if (! in_array($assignment->status, [DeliveryStatus::ASSIGNED, DeliveryStatus::ACCEPTED, DeliveryStatus::FAILED], true)) {
                throw new DomainException('This delivery cannot be reassigned in its current state.', 422);
            }

            if ($newPartner->status !== DeliveryPartnerStatus::APPROVED) {
                throw new DomainException('Only approved delivery partners can be assigned.', 422);
            }

            $vendorOrder = VendorOrder::query()->whereKey($assignment->vendor_order_id)->lockForUpdate()->firstOrFail();

            if (in_array($vendorOrder->status, $this->terminalOrderStatuses(), true)) {
                throw new DomainException('Vendor order is no longer assignable.', 422);
            }

            $resolvedDeliveryFee = $deliveryFee !== null ? $deliveryFee : (float) $assignment->delivery_fee;
            $resolvedCodAmount = $codAmount !== null ? $codAmount : (float) $assignment->cod_amount;

            // Mark this and any other active assignments for this vendor order as reassigned / retired
            $activeAssignments = $vendorOrder->assignments()->active()->lockForUpdate()->get();
            foreach ($activeAssignments as $act) {
                $act->update([
                    'status' => DeliveryStatus::FAILED,
                    'failed_at' => now(),
                    'failure_reason' => 'Reassigned to ' . $newPartner->name . ($reason ? ': ' . $reason : ''),
                    'meta' => array_merge($act->meta ?? [], [
                        'reassigned_to' => $newPartner->uuid,
                        'reassigned_to_name' => $newPartner->name,
                        'reassignment_reason' => $reason,
                        'reassigned_by_user_id' => $admin->id,
                        'reassigned_by_name' => $admin->full_name ?? $admin->name,
                        'reassigned_at' => now()->toISOString(),
                    ]),
                ]);
                $this->recordTracking($act, DeliveryStatus::FAILED, 'Reassigned to ' . $newPartner->name . '. Reason: ' . $reason, null);
            }

            $newAssignment = $this->assignOrder(
                actor: $admin,
                vendorOrder: $vendorOrder,
                partner: $newPartner,
                method: 'manual_admin',
                deliveryFee: $resolvedDeliveryFee,
                codAmount: $resolvedCodAmount,
                notes: $notes,
                withinReassignment: true,
            );

            $newAssignment->forceFill([
                'meta' => array_merge($newAssignment->meta ?? [], [
                    'reassigned_from' => $assignment->uuid,
                    'previous_delivery_partner_id' => $assignment->deliveryPartner?->uuid,
                    'previous_delivery_partner_name' => $assignment->deliveryPartner?->name,
                    'reassignment_reason' => $reason,
                    'reassignment_note' => $notes,
                ]),
            ])->save();

            $this->recordAudit($admin, 'delivery.reassigned', 'delivery_assignment', $newAssignment, null, [
                'vendor_order' => $vendorOrder->uuid,
                'vendor_order_number' => $vendorOrder->vendor_order_number,
                'from_partner' => $assignment->deliveryPartner?->name,
                'to_partner' => $newPartner->uuid,
                'to_partner_name' => $newPartner->name,
                'reason' => $reason,
            ]);

            return $newAssignment;
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
        $this->assertStatus($assignment, [DeliveryStatus::ACCEPTED, DeliveryStatus::ASSIGNED], 'Delivery must be accepted or assigned before pickup.');

        $updates = [
            'status' => DeliveryStatus::PICKED_UP,
            'picked_up_at' => now(),
        ];
        if (! $assignment->accepted_at) {
            $updates['accepted_at'] = now();
        }

        $assignment->update($updates);

        $this->transitionVendorOrder($assignment->vendorOrder, OrderStatus::PICKED_UP, $partnerUser);
        $this->transitionDelivery($assignment->vendorOrder, DeliveryStatus::PICKED_UP, $partnerUser);
        $this->recordTracking($assignment, DeliveryStatus::PICKED_UP, 'Order picked up from vendor.', null);

        $this->syncOrder($assignment->vendorOrder->order, $partnerUser);

        // Ensure delivery OTP is generated upon pickup
        $this->getOrGenerateDeliveryOtp($assignment);

        $this->dispatcher->orderDeliveryUpdate($assignment->vendorOrder, 'picked_up');

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

        $this->syncOrder($assignment->vendorOrder->order, $partnerUser);

        $otp = $this->getOrGenerateDeliveryOtp($assignment);

        $this->dispatcher->orderDeliveryUpdate($assignment->vendorOrder, 'out_for_delivery');

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

            $this->dispatcher->orderDeliveryUpdate($vendorOrder, 'delivered');
            $this->dispatcher->orderInvoiceWhenAllDelivered($order);

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

        $this->dispatcher->deliveryFailed($assignment, $reason);

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

        $this->dispatcher->deliveryReturned($assignment);

        return $assignment->fresh(['tracking']);
    }

    public function dispatchList(array $filters): LengthAwarePaginator
    {
        $query = $this->dispatchScopeQuery()
            ->with(['order.user', 'store', 'latestAssignment.deliveryPartner'])
            ->withCount('items as package_count');

        $status = (string) ($filters['status'] ?? 'all');
        if ($status !== '' && $status !== 'all') {
            if ($status === 'pending_assignment') {
                $query
                    ->where('status', OrderStatus::READY_FOR_PICKUP->value)
                    ->whereDoesntHave('assignments', fn ($q) => $q->active());
            } elseif ($status === 'needs_reassignment') {
                $query->whereHas('latestAssignment', fn (Builder $q) => $q->where('status', DeliveryStatus::FAILED))
                    ->whereDoesntHave('assignments', fn ($q) => $q->active());
            } else {
                $statusValue = DeliveryStatus::tryFrom($status);
                if ($statusValue !== null) {
                    $query->whereHas('latestAssignment', fn ($q) => $q->where('status', $statusValue));
                }
            }
        }

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function (Builder $q) use ($like) {
                $q->where('vendor_order_number', 'like', $like)
                    ->orWhere('delivery_partner_name', 'like', $like)
                    ->orWhereHas('order', function (Builder $oq) use ($like) {
                        $oq->where('order_number', 'like', $like)
                            ->orWhereHas('user', function (Builder $uq) use ($like) {
                                $uq->where('first_name', 'like', $like)
                                    ->orWhere('last_name', 'like', $like)
                                    ->orWhere('phone', 'like', $like);
                            });
                    })
                    ->orWhereHas('store', fn (Builder $sq) => $sq->where('name', 'like', $like))
                    ->orWhereHas('latestAssignment.deliveryPartner', fn (Builder $pq) => $pq->where('name', 'like', $like));
            });
        }

        if (! empty($filters['partner_id'])) {
            $query->whereHas('latestAssignment.deliveryPartner', fn (Builder $q) => $q->where('uuid', (string) $filters['partner_id']));
        }

        if (! empty($filters['store_id'])) {
            $query->whereHas('store', fn (Builder $q) => $q->where('uuid', (string) $filters['store_id']));
        }

        $paymentMethod = (string) ($filters['payment_method'] ?? '');
        if ($paymentMethod === 'cod') {
            $query->whereHas('order', fn (Builder $q) => $q->where('payment_method', PaymentMethod::COD->value));
        } elseif ($paymentMethod === 'prepaid') {
            $query->whereHas('order', fn (Builder $q) => $q->where('payment_method', '!=', PaymentMethod::COD->value)->whereNotNull('payment_method'));
        }

        $fromDate = $this->safeDate($filters['from'] ?? null);
        $toDate = $this->safeDate($filters['to'] ?? null);

        if ($fromDate !== null) {
            $query->whereDate('updated_at', '>=', $fromDate);
        }

        if ($toDate !== null) {
            $query->whereDate('updated_at', '<=', $toDate);
        }

        return $query->latest('id')->paginate((int) ($filters['per_page'] ?? 15));
    }

    public function dispatchSummary(): array
    {
        $tally = [
            'pending_assignment' => 0,
            'assigned' => 0,
            'pickup_pending' => 0,
            'in_transit' => 0,
            'out_for_delivery' => 0,
            'delivered' => 0,
            'failed' => 0,
            'returned_to_vendor' => 0,
            'needs_reassignment' => 0,
        ];

        $rows = $this->dispatchScopeQuery()->with('latestAssignment')->get(['id', 'status']);

        foreach ($rows as $vendorOrder) {
            $assignmentStatus = $vendorOrder->latestAssignment?->status;

            if ($assignmentStatus === null) {
                $tally['pending_assignment']++;
                continue;
            }

            switch ($assignmentStatus) {
                case DeliveryStatus::ASSIGNED:
                    $tally['assigned']++;
                    break;
                case DeliveryStatus::ACCEPTED:
                    $tally['pickup_pending']++;
                    break;
                case DeliveryStatus::PICKED_UP:
                    $tally['in_transit']++;
                    break;
                case DeliveryStatus::OUT_FOR_DELIVERY:
                    $tally['out_for_delivery']++;
                    break;
                case DeliveryStatus::DELIVERED:
                    $tally['delivered']++;
                    break;
                case DeliveryStatus::FAILED:
                    $tally['failed']++;
                    $tally['needs_reassignment']++;
                    break;
                case DeliveryStatus::RETURNED_TO_VENDOR:
                    $tally['returned_to_vendor']++;
                    break;
            }
        }

        return $tally;
    }

    public function eligiblePartnersForOrder(VendorOrder $vendorOrder): array
    {
        $candidateAreas = $this->candidateAreasFor($vendorOrder);

        /** @var Collection<int, DeliveryPartner> $partners */
        $partners = DeliveryPartner::query()->approved()->get();
        $partnerIds = $partners->pluck('id');

        $activeStatuses = [
            DeliveryStatus::ASSIGNED,
            DeliveryStatus::ACCEPTED,
            DeliveryStatus::PICKED_UP,
            DeliveryStatus::OUT_FOR_DELIVERY,
        ];

        $workload = DeliveryAssignment::query()
            ->whereIn('status', $activeStatuses)
            ->whereIn('delivery_partner_id', $partnerIds)
            ->selectRaw('delivery_partner_id, COUNT(*) as total')
            ->groupBy('delivery_partner_id')
            ->pluck('total', 'delivery_partner_id');

        $pendingPickups = DeliveryAssignment::query()
            ->where('status', DeliveryStatus::ACCEPTED)
            ->whereIn('delivery_partner_id', $partnerIds)
            ->selectRaw('delivery_partner_id, COUNT(*) as total')
            ->groupBy('delivery_partner_id')
            ->pluck('total', 'delivery_partner_id');

        $todayCompleted = DeliveryAssignment::query()
            ->where('status', DeliveryStatus::DELIVERED)
            ->whereIn('delivery_partner_id', $partnerIds)
            ->whereDate('delivered_at', Carbon::today())
            ->selectRaw('delivery_partner_id, COUNT(*) as total')
            ->groupBy('delivery_partner_id')
            ->pluck('total', 'delivery_partner_id');

        $todayFailed = DeliveryAssignment::query()
            ->where('status', DeliveryStatus::FAILED)
            ->whereIn('delivery_partner_id', $partnerIds)
            ->whereDate('failed_at', Carbon::today())
            ->selectRaw('delivery_partner_id, COUNT(*) as total')
            ->groupBy('delivery_partner_id')
            ->pluck('total', 'delivery_partner_id');

        return $partners
            ->map(function (DeliveryPartner $partner) use ($workload, $pendingPickups, $todayCompleted, $todayFailed, $candidateAreas) {
                return [
                    'id' => $partner->uuid,
                    'name' => $partner->name,
                    'phone' => $partner->phone,
                    'vehicle_type' => $partner->vehicle_type,
                    'vehicle_number' => $partner->vehicle_number,
                    'status' => $partner->status->value,
                    'is_online' => (bool) $partner->is_online,
                    'rating_avg' => round((float) $partner->rating_avg, 1),
                    'rating_count' => (int) $partner->rating_count,
                    'service_areas' => (array) ($partner->service_areas ?? []),
                    'active_deliveries' => (int) ($workload[$partner->id] ?? 0),
                    'pending_pickups' => (int) ($pendingPickups[$partner->id] ?? 0),
                    'today_completed' => (int) ($todayCompleted[$partner->id] ?? 0),
                    'today_failed' => (int) ($todayFailed[$partner->id] ?? 0),
                    'serves_order_area' => $this->partnerMatchesAreas($partner, $candidateAreas),
                    'available' => $partner->is_online && $partner->status === DeliveryPartnerStatus::APPROVED,
                    'capacity_available' => null,
                ];
            })
            ->sortBy(function (array $row) {
                return [
                    $row['available'] ? 0 : 1,
                    $row['serves_order_area'] ? 0 : 1,
                    $row['active_deliveries'],
                ];
            })
            ->values()
            ->all();
    }

    public function dispatchDetail(VendorOrder $vendorOrder): array
    {
        $vendorOrder->load(['order.user', 'items', 'store', 'latestAssignment.deliveryPartner']);

        $order = $vendorOrder->order;
        $assignment = $vendorOrder->latestAssignment;
        $assignmentPartner = $assignment?->deliveryPartner;

        $history = $vendorOrder->assignments()
            ->with(['deliveryPartner', 'tracking'])
            ->get()
            ->map(function (DeliveryAssignment $item) {
                return $this->assignmentHistoryRow($item);
            })
            ->values()
            ->all();

        $timeline = collect($history)
            ->flatMap(fn (array $row) => $row['tracking'])
            ->sortByDesc(fn (array $event) => $event['timestamp'])
            ->values()
            ->all();

        return [
            'id' => $vendorOrder->uuid,
            'vendor_order_number' => $vendorOrder->vendor_order_number,
            'vendor_order_status' => $vendorOrder->status->value,
            'delivery_status' => $vendorOrder->delivery_status->value,
            'dispatch_status' => $assignment?->status->value ?? 'pending_assignment',
            'package_count' => $vendorOrder->items->count(),
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'placed_at' => $order->placed_at?->toISOString() ?? $order->created_at?->toISOString(),
                'order_status' => $order->status?->value,
                'payment_status' => $order->payment_status?->value,
                'payment_method' => $order->payment_method,
                'grand_total' => (float) $order->grand_total,
                'subtotal' => (float) $order->subtotal,
                'delivery_charge' => (float) ($order->delivery_charge ?? 0),
                'discount' => (float) ($order->discount ?? 0),
                'tax' => (float) ($order->tax ?? 0),
            ],
            'customer' => [
                'full_name' => $order->user?->full_name,
                'phone' => $order->user?->phone,
                'email' => $order->user?->email,
                'recipient_name' => $this->recipientNameFor($order),
                'recipient_phone' => $this->recipientPhoneFor($order),
            ],
            'store' => [
                'id' => $vendorOrder->store?->uuid,
                'name' => $vendorOrder->store?->name,
                'pickup_address' => $assignment?->pickup_address ?? $this->pickupAddressFor($vendorOrder),
            ],
            'delivery' => [
                'dropoff_address' => $assignment?->dropoff_address ?? $this->dropoffAddressFor($order),
                'delivery_area' => $this->deliveryAreaFor($order),
                'delivery_fee' => $assignment?->delivery_fee !== null ? (float) $assignment->delivery_fee : (float) $vendorOrder->delivery_charge,
                'cod_amount' => $assignment?->cod_amount !== null ? (float) $assignment->cod_amount : null,
            ],
            'current_assignment' => $assignment ? [
                'id' => $assignment->uuid,
                'status' => $assignment->status->value,
                'assigned_at' => $assignment->assigned_at?->toISOString(),
                'accepted_at' => $assignment->accepted_at?->toISOString(),
                'picked_up_at' => $assignment->picked_up_at?->toISOString(),
                'out_for_delivery_at' => $assignment->out_for_delivery_at?->toISOString(),
                'delivered_at' => $assignment->delivered_at?->toISOString(),
                'failed_at' => $assignment->failed_at?->toISOString(),
                'failure_reason' => $assignment->failure_reason,
                'meta' => $assignment->meta,
                'partner' => $assignmentPartner ? $this->partnerRow($assignmentPartner) : null,
            ] : null,
            'items' => $vendorOrder->items->map(fn ($item) => [
                'product_name' => $item->product_name,
                'quantity' => (int) $item->quantity,
                'unit_price' => (float) $item->unit_price,
                'line_total' => (float) $item->line_total,
            ])->values()->all(),
            'history' => $history,
            'timeline' => $timeline,
            'actions' => [
                'can_assign' => ($assignment === null || ! $vendorOrder->assignments()->active()->exists())
                    && $vendorOrder->status === OrderStatus::READY_FOR_PICKUP,
                'can_reassign' => $assignment !== null && in_array($assignment->status, [
                    DeliveryStatus::ASSIGNED,
                    DeliveryStatus::ACCEPTED,
                    DeliveryStatus::FAILED,
                ], true) && ! in_array($vendorOrder->status, $this->terminalOrderStatuses(), true),
            ],
        ];
    }

    public function dashboard(array $range): array
    {
        [$from, $to, $label] = $range;

        $active = [
            DeliveryStatus::ASSIGNED,
            DeliveryStatus::ACCEPTED,
            DeliveryStatus::PICKED_UP,
            DeliveryStatus::OUT_FOR_DELIVERY,
        ];

        $orderReadyStatuses = [
            OrderStatus::ACCEPTED->value,
            OrderStatus::PREPARING->value,
            OrderStatus::READY_FOR_PICKUP->value,
        ];

        $pendingAssignment = VendorOrder::query()
            ->whereIn('status', $orderReadyStatuses)
            ->whereDoesntHave('assignments', fn ($q) => $q->whereIn('status', $active))
            ->count();

        $assigned = $this->countAssignmentStatus(DeliveryStatus::ASSIGNED);
        $pickupPending = $this->countAssignmentStatus(DeliveryStatus::ACCEPTED);
        $inTransit = $this->countAssignmentStatus(DeliveryStatus::PICKED_UP);
        $outForDelivery = $this->countAssignmentStatus(DeliveryStatus::OUT_FOR_DELIVERY);
        $deliveredTotal = $this->countAssignmentStatus(DeliveryStatus::DELIVERED);

        $deliveredInRange = DeliveryAssignment::query()
            ->where('status', DeliveryStatus::DELIVERED)
            ->whereBetween('delivered_at', [$from, $to])
            ->count();

        $failedInRange = DeliveryAssignment::query()
            ->where('status', DeliveryStatus::FAILED)
            ->whereBetween('failed_at', [$from, $to])
            ->count();

        $returnsRtoInRange = DeliveryAssignment::query()
            ->where('status', DeliveryStatus::RETURNED_TO_VENDOR)
            ->whereBetween('updated_at', [$from, $to])
            ->count();

        $codPending = round((float) DeliveryAssignment::query()
            ->whereIn('status', $active)
            ->where('cod_amount', '>', 0)
            ->sum('cod_amount'), 2);

        $codCollectedInRange = round((float) DeliveryAssignment::query()
            ->where('status', DeliveryStatus::DELIVERED)
            ->where('cod_amount', '>', 0)
            ->whereBetween('delivered_at', [$from, $to])
            ->sum('cod_amount'), 2);

        $summary = [
            'pending_assignment' => $pendingAssignment,
            'pickup_pending' => $pickupPending,
            'in_transit' => $inTransit,
            'out_for_delivery' => $outForDelivery,
            'delivered' => $deliveredInRange,
            'failed' => $failedInRange,
            'returns_rto' => $returnsRtoInRange,
            'cod_pending' => $codPending,
            'range_label' => $label,
        ];

        $pipeline = [
            ['key' => 'order_ready', 'label' => 'Order Ready', 'count' => $pendingAssignment],
            ['key' => 'assigned', 'label' => 'Assigned', 'count' => $assigned],
            ['key' => 'pickup_scheduled', 'label' => 'Pickup Scheduled', 'count' => $pickupPending],
            ['key' => 'picked_up', 'label' => 'Picked Up', 'count' => $inTransit],
            ['key' => 'out_for_delivery', 'label' => 'Out for Delivery', 'count' => $outForDelivery],
            ['key' => 'delivered', 'label' => 'Delivered', 'count' => $deliveredTotal],
        ];

        $alerts = $this->resolveDeliveryAlerts($active, $orderReadyStatuses, $codPending);

        $busyPartnerIds = DeliveryAssignment::query()
            ->whereIn('status', $active)
            ->whereNotNull('delivery_partner_id')
            ->groupBy('delivery_partner_id')
            ->pluck('delivery_partner_id');

        $partners = [
            'online' => DeliveryPartner::query()->approved()->where('is_online', true)->count(),
            'busy' => DeliveryPartner::query()->approved()->whereIn('id', $busyPartnerIds)->count(),
            'offline' => DeliveryPartner::query()->approved()->where('is_online', false)->count(),
            'suspended' => DeliveryPartner::query()->where('status', DeliveryPartnerStatus::SUSPENDED)->count(),
            'total' => DeliveryPartner::query()->approved()->count(),
        ];

        $recentActivity = DeliveryTracking::query()
            ->with(['assignment.deliveryPartner', 'assignment.vendorOrder.order'])
            ->whereBetween('tracked_at', [$from, $to])
            ->latest('tracked_at')
            ->limit(10)
            ->get()
            ->map(function (DeliveryTracking $tracking) {
                return [
                    'id' => $tracking->uuid,
                    'order_reference' => $tracking->vendorOrder?->vendor_order_number,
                    'order_number' => $tracking->vendorOrder?->order?->order_number,
                    'assignment_id' => $tracking->assignment?->uuid,
                    'status' => $tracking->status->value,
                    'note' => $tracking->note,
                    'partner_name' => $tracking->assignment?->deliveryPartner?->name,
                    'tracked_at' => $tracking->tracked_at?->toISOString(),
                ];
            })
            ->values()
            ->all();

        $snapshot = [
            'deliveries_created' => DeliveryAssignment::query()->whereBetween('created_at', [$from, $to])->count(),
            'delivered' => $deliveredInRange,
            'cod_collected' => $codCollectedInRange,
            'cod_pending' => $codPending,
            'active_partners' => DeliveryPartner::query()->approved()->count(),
        ];

        return compact('summary', 'pipeline', 'alerts', 'partners', 'recentActivity', 'snapshot');
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
        return DB::transaction(function () use ($vendorOrder, $actor) {
            $vendorOrder = VendorOrder::query()->whereKey($vendorOrder->getKey())->lockForUpdate()->firstOrFail();

            if ($vendorOrder->status !== OrderStatus::PENDING) {
                if (in_array($vendorOrder->status, [OrderStatus::CANCELLED, OrderStatus::REJECTED], true)) {
                    throw new DomainException('This order has been cancelled and cannot be confirmed.', 422);
                }
                if (in_array($vendorOrder->status, [OrderStatus::ACCEPTED, OrderStatus::PROCESSING, OrderStatus::CONFIRMED, OrderStatus::READY_FOR_PICKUP], true)) {
                    throw new DomainException('This order has already been confirmed.', 422);
                }
                throw new DomainException('Only pending vendor orders can be accepted.', 422);
            }

            $order = $vendorOrder->order()->lockForUpdate()->first();
            $placedAt = \Illuminate\Support\Carbon::parse($order?->placed_at ?? $order?->created_at ?? $vendorOrder->created_at);

            // 1. Cancellation Window Check: Vendor cannot confirm while customer cancellation window is active
            $cancellationWindowMins = (int) Setting::get('order.cancellation_window_minutes', 15);
            $cancellationWindowEndsAt = $placedAt->copy()->addMinutes($cancellationWindowMins);

            if (now()->lessThan($cancellationWindowEndsAt)) {
                $remainingSeconds = now()->diffInSeconds($cancellationWindowEndsAt);
                $remainingMinutes = (int) ceil($remainingSeconds / 60);
                throw new DomainException(
                    "Order cannot be confirmed during the customer cancellation window ({$remainingMinutes} minute(s) remaining).",
                    422
                );
            }

            // 2. Maximum Vendor Confirmation Deadline Check (24 hours default)
            $deadlineHours = (int) Setting::get('order.vendor_confirmation_deadline_hours', 24);
            $deadline = $placedAt->copy()->addHours($deadlineHours);

            if (now()->greaterThanOrEqualTo($deadline)) {
                throw new DomainException(
                    "The vendor confirmation deadline of {$deadlineHours} hours has expired. This order is no longer eligible for confirmation.",
                    422
                );
            }

            // 3. Mark Confirmed (manual)
            $meta = (array) ($vendorOrder->meta ?? []);
            $meta['confirmation_method'] = 'manual';
            $meta['confirmed_at'] = now()->toISOString();
            $meta['confirmed_by'] = $actor->id;
            $vendorOrder->meta = $meta;
            $vendorOrder->save();

            $this->transitionVendorOrder($vendorOrder, OrderStatus::ACCEPTED, $actor);
            $this->syncOrder($vendorOrder->order, $actor);

            if ($order && ! $order->confirmed_at) {
                $order->confirmed_at = now();
                $order->save();
            }

            // If the store has Auto Ready for Pickup enabled, immediately advance to READY_FOR_PICKUP
            $store = $vendorOrder->store ?? $vendorOrder->vendor?->stores()->first();
            $storeSettings = (array) ($store?->settings ?? []);
            if (! empty($storeSettings['auto_ready_for_pickup'])) {
                $this->transitionVendorOrder($vendorOrder, OrderStatus::READY_FOR_PICKUP, $actor);
                $this->syncOrder($vendorOrder->order, $actor);
                $this->dispatcher->orderDeliveryUpdate($vendorOrder, 'ready_for_pickup');
            } else {
                $this->dispatcher->orderDeliveryUpdate($vendorOrder, 'confirmed');
            }

            return $vendorOrder;
        });
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
        $this->syncOrder($vendorOrder->order, $actor);
        $this->dispatcher->orderDeliveryUpdate($vendorOrder, 'ready_for_pickup');

        return $vendorOrder;
    }

    public function resolvePartnerForOrder(VendorOrder $vendorOrder): DeliveryPartner
    {
        $order = $vendorOrder->order()->first();
        if (! $order) {
            throw new DomainException('The vendor order is not linked to a valid order.', 404);
        }

        $candidateAreas = $this->candidateAreasFor($vendorOrder);

        $partners = DeliveryPartner::query()
            ->approved()
            ->where('is_online', true)
            ->get();

        $bestPartner = $partners->filter(fn (DeliveryPartner $partner) => $this->partnerMatchesAreas($partner, $candidateAreas))
            ->sortByDesc(function (DeliveryPartner $partner) {
                $areas = array_filter(array_map('trim', (array) ($partner->service_areas ?? [])));
                return count($areas);
            })->first();

        if (! $bestPartner) {
            throw new DomainException('No approved delivery partner is available for this order location. Please assign a rider manually.', 422);
        }

        return $bestPartner;
    }

    protected function countAssignmentStatus(DeliveryStatus $status): int
    {
        return DeliveryAssignment::query()->where('status', $status)->count();
    }

    protected function assignableOrderStatuses(): array
    {
        return [
            OrderStatus::READY_FOR_PICKUP,
        ];
    }

    private function assignableOrderStatusValues(): array
    {
        return array_map(static fn (OrderStatus $status) => $status->value, $this->assignableOrderStatuses());
    }

    protected function terminalOrderStatuses(): array
    {
        return [
            OrderStatus::DELIVERED,
            OrderStatus::COMPLETED,
            OrderStatus::CANCELLED,
            OrderStatus::RETURNED,
            OrderStatus::REJECTED,
            OrderStatus::REFUNDED,
            OrderStatus::FAILED,
        ];
    }

    private function terminalOrderStatusValues(): array
    {
        return array_map(static fn (OrderStatus $status) => $status->value, $this->terminalOrderStatuses());
    }

    protected function liveAssignmentStatuses(): array
    {
        return [
            DeliveryStatus::ASSIGNED->value,
            DeliveryStatus::ACCEPTED->value,
            DeliveryStatus::PICKED_UP->value,
            DeliveryStatus::OUT_FOR_DELIVERY->value,
            DeliveryStatus::FAILED->value,
        ];
    }

    protected function dispatchScopeQuery(): Builder
    {
        return VendorOrder::query()
            ->where(function (Builder $query) {
                $query->where('status', OrderStatus::READY_FOR_PICKUP->value)
                    ->orWhere(function (Builder $or) {
                        $or->whereNotIn('status', $this->terminalOrderStatusValues())
                            ->whereHas('assignments', fn (Builder $assignment) => $assignment->whereIn('status', $this->liveAssignmentStatuses()));
                    });
            });
    }

    protected function candidateAreasFor(VendorOrder $vendorOrder): array
    {
        $order = $vendorOrder->order()->first();
        if (! $order) {
            return [];
        }

        $snapshot = json_decode((string) $order->shipping_address_snapshot, true);
        if (! is_array($snapshot)) {
            return [];
        }

        $province = trim((string) ($snapshot['province'] ?? $snapshot['state'] ?? ''));
        $district = trim((string) ($snapshot['district'] ?? $snapshot['city'] ?? ''));
        $municipality = trim((string) ($snapshot['municipality'] ?? ''));

        $areas = array_filter([$province, $district, $municipality]);

        $zoneMatches = ShippingZone::query()
            ->where('is_active', true)
            ->get()
            ->filter(fn (ShippingZone $zone) => $zone->matchesLocation($province, $district, $municipality));

        foreach ($zoneMatches as $zone) {
            if (! empty($zone->provinces)) {
                $areas = array_merge($areas, $zone->provinces);
            }
            if (! empty($zone->name)) {
                $areas[] = $zone->name;
            }
        }

        return array_values(array_filter(array_unique($areas)));
    }

    protected function partnerMatchesAreas(DeliveryPartner $partner, array $candidateAreas): bool
    {
        $areas = array_filter(array_map('trim', (array) ($partner->service_areas ?? [])));

        // If partner has no specific area restrictions, or specified all/wildcard/nepal, they are eligible for all areas
        if ($areas === []
            || in_array('*', $areas, true)
            || in_array('all', array_map('strtolower', $areas), true)
            || in_array('nepal', array_map('strtolower', $areas), true)
            || in_array('all areas', array_map('strtolower', $areas), true)) {
            return true;
        }

        if ($candidateAreas === []) {
            return true;
        }

        foreach ($candidateAreas as $area) {
            $needle = mb_strtolower((string) $area);
            if ($needle === '') continue;
            foreach ($areas as $serviceArea) {
                $value = mb_strtolower((string) $serviceArea);
                if ($value === '') continue;
                if ($needle === $value || str_contains($value, $needle) || str_contains($needle, $value)) {
                    return true;
                }
            }
        }

        return false;
    }

    protected function deliveryAreaFor(Order $order): array
    {
        $snapshot = json_decode((string) $order->shipping_address_snapshot, true);

        if (! is_array($snapshot)) {
            return [];
        }

        return array_filter([
            'province' => $snapshot['province'] ?? $snapshot['state'] ?? null,
            'district' => $snapshot['district'] ?? $snapshot['city'] ?? null,
            'municipality' => $snapshot['municipality'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');
    }

    public function availableJobsForPartner(User $user, array $filters = []): LengthAwarePaginator
    {
        $partner = $this->partnerFor($user);

        if ($partner->status !== DeliveryPartnerStatus::APPROVED) {
            throw new DomainException('Your delivery partner account is not active or approved.', 403);
        }

        $query = VendorOrder::query()
            ->where('status', OrderStatus::READY_FOR_PICKUP)
            ->whereDoesntHave('assignments', fn (Builder $q) => $q->active())
            ->with(['store.addresses.province', 'store.addresses.district', 'store.addresses.municipality', 'store.vendor', 'order', 'items'])
            ->latest('updated_at');

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $like = '%' . $search . '%';
            $query->where(function (Builder $q) use ($like) {
                $q->where('vendor_order_number', 'like', $like)
                    ->orWhereHas('store', fn ($sq) => $sq->where('name', 'like', $like))
                    ->orWhereHas('items', fn ($iq) => $iq->where('product_name', 'like', $like));
            });
        }

        $allOrders = $query->get();

        $hasSpecificAreas = ! empty(array_filter(array_map('trim', (array) ($partner->service_areas ?? []))));
        $scope = strtolower(trim((string) ($filters['scope'] ?? 'my_area')));

        if ($hasSpecificAreas && $scope !== 'all') {
            $filtered = $allOrders->filter(function (VendorOrder $vendorOrder) use ($partner) {
                $candidateAreas = $this->candidateAreasFor($vendorOrder);
                return $this->partnerMatchesAreas($partner, $candidateAreas);
            })->values();
        } else {
            $filtered = $allOrders;
        }

        $perPage = max(1, min(50, (int) ($filters['per_page'] ?? 15)));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $total = $filtered->count();
        $slice = $filtered->slice(($page - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator($slice, $total, $perPage, $page, [
            'path' => request()->url(),
            'query' => request()->query(),
        ]);
    }

    public function partnerDashboardStats(User $user): array
    {
        $partner = $this->partnerFor($user);

        $activeStatuses = [
            DeliveryStatus::ASSIGNED,
            DeliveryStatus::ACCEPTED,
            DeliveryStatus::PICKED_UP,
            DeliveryStatus::OUT_FOR_DELIVERY,
        ];

        $assignedCount = $partner->assignments()
            ->whereIn('status', [DeliveryStatus::ASSIGNED, DeliveryStatus::ACCEPTED])
            ->count();

        $activeCount = $partner->assignments()
            ->whereIn('status', [DeliveryStatus::PICKED_UP, DeliveryStatus::OUT_FOR_DELIVERY])
            ->count();

        $todayCompletedCount = $partner->assignments()
            ->where('status', DeliveryStatus::DELIVERED)
            ->whereDate('delivered_at', Carbon::today())
            ->count();

        $todayFailedCount = $partner->assignments()
            ->where('status', DeliveryStatus::FAILED)
            ->whereDate('failed_at', Carbon::today())
            ->count();

        $codToCollect = (float) $partner->assignments()
            ->whereIn('status', $activeStatuses)
            ->where('cod_amount', '>', 0)
            ->sum('cod_amount');

        $codCollectedToday = (float) $partner->assignments()
            ->where('status', DeliveryStatus::DELIVERED)
            ->whereDate('delivered_at', Carbon::today())
            ->where('cod_amount', '>', 0)
            ->sum('cod_amount');

        // Available jobs count
        $availableJobsCount = 0;
        $allAvailableJobsCount = 0;
        if ($partner->status === DeliveryPartnerStatus::APPROVED) {
            $availQuery = VendorOrder::query()
                ->where('status', OrderStatus::READY_FOR_PICKUP)
                ->whereDoesntHave('assignments', fn (Builder $q) => $q->active())
                ->with(['store.addresses.province', 'store.addresses.district', 'store.addresses.municipality', 'store.vendor', 'order']);

            $allAvailableJobs = $availQuery->get();
            $allAvailableJobsCount = $allAvailableJobs->count();

            $hasSpecificAreas = ! empty(array_filter(array_map('trim', (array) ($partner->service_areas ?? []))));
            if ($hasSpecificAreas) {
                $availableJobsCount = $allAvailableJobs->filter(function (VendorOrder $vo) use ($partner) {
                    return $this->partnerMatchesAreas($partner, $this->candidateAreasFor($vo));
                })->count();
            } else {
                $availableJobsCount = $allAvailableJobsCount;
            }
        }

        return [
            'is_online' => (bool) $partner->is_online,
            'status' => $partner->status->value,
            'available_jobs' => $availableJobsCount,
            'all_available_jobs' => $allAvailableJobsCount,
            'assigned' => $assignedCount,
            'active_in_transit' => $activeCount,
            'today_completed' => $todayCompletedCount,
            'today_failed' => $todayFailedCount,
            'cod_to_collect' => round($codToCollect, 2),
            'cod_collected_today' => round($codCollectedToday, 2),
            'rating_avg' => round((float) $partner->rating_avg, 1),
            'vehicle_type' => $partner->vehicle_type,
            'service_areas' => (array) ($partner->service_areas ?? []),
        ];
    }

    public function assignmentHistoryRow(DeliveryAssignment $assignment): array
    {
        $partner = $assignment->deliveryPartner;
        $meta = $assignment->meta ?? [];
        $method = $meta['assignment_method'] ?? 'manual_admin';
        $methodLabel = match ($method) {
            'self_claim' => 'Delivery-User Claim',
            'manual_admin' => 'Super Admin Manual Assignment',
            default => ucfirst(str_replace('_', ' ', (string) $method)),
        };

        $actingUserName = $meta['assigned_by_name']
            ?? $assignment->assignedBy?->full_name
            ?? $assignment->assignedBy?->name
            ?? ($method === 'self_claim' ? $partner?->name : 'Super Admin');

        return [
            'id' => $assignment->uuid,
            'status' => $assignment->status->value,
            'assignment_method' => $method,
            'assignment_method_label' => $methodLabel,
            'acting_user' => $actingUserName,
            'acting_user_role' => $meta['assigned_by_role'] ?? ($method === 'self_claim' ? 'delivery_partner' : 'super_admin'),
            'delivery_fee' => (float) $assignment->delivery_fee,
            'cod_amount' => (float) $assignment->cod_amount,
            'assigned_at' => $assignment->assigned_at?->toISOString(),
            'accepted_at' => $assignment->accepted_at?->toISOString(),
            'picked_up_at' => $assignment->picked_up_at?->toISOString(),
            'out_for_delivery_at' => $assignment->out_for_delivery_at?->toISOString(),
            'delivered_at' => $assignment->delivered_at?->toISOString(),
            'failed_at' => $assignment->failed_at?->toISOString(),
            'failure_reason' => $assignment->failure_reason,
            'reassignment_reason' => $meta['reassignment_reason'] ?? null,
            'reassignment_note' => $meta['reassignment_note'] ?? null,
            'previous_delivery_partner_name' => $meta['previous_delivery_partner_name'] ?? null,
            'meta' => $meta,
            'partner' => $partner ? $this->partnerRow($partner) : null,
            'tracking' => $assignment->tracking
                ->sortByDesc(fn ($event) => $event->tracked_at)
                ->values()
                ->map(fn ($event) => [
                    'id' => $event->uuid,
                    'status' => $event->status->value,
                    'note' => $event->note,
                    'timestamp' => $event->tracked_at?->toISOString(),
                ])
                ->all(),
        ];
    }

    protected function partnerRow(DeliveryPartner $partner): array
    {
        return [
            'id' => $partner->uuid,
            'name' => $partner->name,
            'phone' => $partner->phone,
            'vehicle_type' => $partner->vehicle_type,
            'vehicle_number' => $partner->vehicle_number,
            'status' => $partner->status->value,
            'is_online' => (bool) $partner->is_online,
            'rating_avg' => round((float) $partner->rating_avg, 1),
        ];
    }

    protected function safeDate(mixed $value): ?Carbon
    {
        if (! is_string($value) || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }

    protected function recordAudit(?User $actor, string $action, string $resourceType, DeliveryAssignment $assignment, ?array $old, array $new): void
    {
        if ($actor === null) {
            return;
        }

        app(AuditLogService::class)->record(
            $actor,
            $action,
            $resourceType,
            $assignment->uuid,
            $old,
            $new,
        );
    }

    protected function resolveDeliveryAlerts(array $active, array $orderReadyStatuses, float $codPending): array
    {
        $alerts = [];
        $twoHoursAgo = now()->subHours(2);
        $fourHoursAgo = now()->subHours(4);

        $unassigned = VendorOrder::query()
            ->whereIn('status', $orderReadyStatuses)
            ->whereDoesntHave('assignments', fn ($q) => $q->whereIn('status', $active))
            ->where('updated_at', '<', $twoHoursAgo)
            ->count();

        if ($unassigned > 0) {
            $alerts[] = [
                'severity' => 'high',
                'title' => 'Unassigned deliveries',
                'count' => $unassigned,
                'description' => $unassigned.' '.($unassigned === 1 ? 'delivery has' : 'deliveries have').' been ready for more than 2 hours without an assignment.',
                'action' => ['label' => 'Review Assignments', 'to' => '/admin/fulfillment/assignments'],
            ];
        }

        $overduePickups = DeliveryAssignment::query()
            ->where('status', DeliveryStatus::ACCEPTED)
            ->where('accepted_at', '<', $twoHoursAgo)
            ->count();

        if ($overduePickups > 0) {
            $alerts[] = [
                'severity' => 'high',
                'title' => 'Overdue pickups',
                'count' => $overduePickups,
                'description' => $overduePickups.' '.($overduePickups === 1 ? 'delivery was' : 'deliveries were').' accepted by a partner but not picked up within 2 hours.',
                'action' => ['label' => 'Review Pickups', 'to' => '/admin/fulfillment/assignments'],
            ];
        }

        $failedAwaitingAction = $this->countAssignmentStatus(DeliveryStatus::FAILED);

        if ($failedAwaitingAction > 0) {
            $alerts[] = [
                'severity' => 'medium',
                'title' => 'Failed deliveries need action',
                'count' => $failedAwaitingAction,
                'description' => $failedAwaitingAction.' '.($failedAwaitingAction === 1 ? 'failed delivery is' : 'failed deliveries are').' waiting for rescheduling or return (RTO) handling.',
                'action' => ['label' => 'Review Failed', 'to' => '/admin/fulfillment/assignments'],
            ];
        }

        $delayed = DeliveryAssignment::query()
            ->where(function (Builder $q) use ($fourHoursAgo) {
                $q->where('status', DeliveryStatus::PICKED_UP)->where('picked_up_at', '<', $fourHoursAgo);
            })
            ->orWhere(function (Builder $q) use ($fourHoursAgo) {
                $q->where('status', DeliveryStatus::OUT_FOR_DELIVERY)->where('out_for_delivery_at', '<', $fourHoursAgo);
            })
            ->count();

        if ($delayed > 0) {
            $alerts[] = [
                'severity' => 'medium',
                'title' => 'Delayed deliveries',
                'count' => $delayed,
                'description' => $delayed.' '.($delayed === 1 ? 'delivery has' : 'deliveries have').' been in transit or out for delivery for more than 4 hours.',
                'action' => ['label' => 'Review Delays', 'to' => '/admin/fulfillment/assignments'],
            ];
        }

        $codOutstandingCount = (int) DeliveryAssignment::query()
            ->whereIn('status', $active)
            ->where('cod_amount', '>', 0)
            ->count();

        if ($codPending > 0) {
            $alerts[] = [
                'severity' => 'low',
                'title' => 'COD outstanding',
                'count' => $codOutstandingCount,
                'description' => 'Rs '.number_format($codPending, 2).' cash is currently outstanding on '.$codOutstandingCount.' active COD '.($codOutstandingCount === 1 ? 'delivery' : 'deliveries').'.',
                'action' => ['label' => 'View Transactions', 'to' => '/admin/finance/payments'],
            ];
        }

        $overloadedIds = DeliveryAssignment::query()
            ->whereIn('status', $active)
            ->whereNotNull('delivery_partner_id')
            ->groupBy('delivery_partner_id')
            ->havingRaw('COUNT(*) >= 3')
            ->pluck('delivery_partner_id');

        $capacityConcern = DeliveryPartner::query()
            ->approved()
            ->where('is_online', true)
            ->whereIn('id', $overloadedIds)
            ->count();

        if ($capacityConcern > 0) {
            $alerts[] = [
                'severity' => 'low',
                'title' => 'Partner capacity',
                'count' => $capacityConcern,
                'description' => $capacityConcern.' '.($capacityConcern === 1 ? 'online partner is' : 'online partners are').' carrying 3 or more concurrent deliveries.',
                'action' => ['label' => 'Review Partners', 'to' => '/admin/fulfillment/partners'],
            ];
        }

        return $alerts;
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

    public function getOrGenerateDeliveryOtp(DeliveryAssignment $assignment): string
    {
        $meta = (array) ($assignment->meta ?? []);
        $existing = $meta['delivery_otp'] ?? null;

        $order = $assignment->vendorOrder?->order;
        if (! $existing && $order && ! empty($order->meta['delivery_otp'])) {
            $existing = $order->meta['delivery_otp'];
        }

        if (! $existing || strlen((string) $existing) !== 6) {
            $existing = sprintf('%06d', random_int(100000, 999999));
        }

        // Persist on assignment meta
        if (($meta['delivery_otp'] ?? null) !== $existing) {
            $meta['delivery_otp'] = $existing;
            $assignment->meta = $meta;
            $assignment->saveQuietly();
        }

        // Persist on parent order meta
        if ($order && ($order->meta['delivery_otp'] ?? null) !== $existing) {
            $orderMeta = (array) ($order->meta ?? []);
            $orderMeta['delivery_otp'] = $existing;
            $order->meta = $orderMeta;
            $order->saveQuietly();
        }

        // Persist on vendor order meta
        $vendorOrder = $assignment->vendorOrder;
        if ($vendorOrder && ($vendorOrder->meta['delivery_otp'] ?? null) !== $existing) {
            $voMeta = (array) ($vendorOrder->meta ?? []);
            $voMeta['delivery_otp'] = $existing;
            $vendorOrder->meta = $voMeta;
            $vendorOrder->saveQuietly();
        }

        Cache::put($this->otpKey($assignment), [
            'code' => hash('sha256', (string) $existing),
            'attempts' => 0,
        ], 86400 * 7);

        return (string) $existing;
    }

    protected function generateOtp(DeliveryAssignment $assignment): string
    {
        return $this->getOrGenerateDeliveryOtp($assignment);
    }

    protected function verifyOtp(DeliveryAssignment $assignment, string $code): bool
    {
        $code = trim($code);
        if ($code === '') {
            return false;
        }

        // Check stored plain OTP on assignment, vendor order, or order
        $storedOtp = (string) (
            $assignment->meta['delivery_otp']
            ?? $assignment->vendorOrder?->meta['delivery_otp']
            ?? $assignment->vendorOrder?->order?->meta['delivery_otp']
            ?? ''
        );

        if ($storedOtp !== '' && hash_equals($storedOtp, $code)) {
            Cache::forget($this->otpKey($assignment));
            return true;
        }

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
        Cache::put($key, $entry, 86400 * 7);

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
        $vendorOrders = $order->vendorOrders()->get();
        if ($vendorOrders->isEmpty()) {
            return;
        }

        $statuses = $vendorOrders->map(fn ($vo) => $vo->status instanceof OrderStatus ? $vo->status->value : (string) $vo->status);
        $deliveryStatuses = $vendorOrders->map(fn ($vo) => $vo->delivery_status instanceof DeliveryStatus ? $vo->delivery_status->value : (string) $vo->delivery_status);

        $delivered = [OrderStatus::DELIVERED->value, OrderStatus::COMPLETED->value];
        $terminal = [OrderStatus::REJECTED->value, OrderStatus::CANCELLED->value, OrderStatus::RETURNED->value, OrderStatus::REFUNDED->value, OrderStatus::FAILED->value];

        $newStatus = null;

        if ($statuses->every(fn ($status) => in_array($status, $delivered, true))) {
            $newStatus = OrderStatus::DELIVERED;
        } elseif ($statuses->every(fn ($status) => in_array($status, $terminal, true))) {
            $newStatus = OrderStatus::CANCELLED;
        } elseif ($deliveryStatuses->contains('out_for_delivery') || $statuses->contains(OrderStatus::OUT_FOR_DELIVERY->value)) {
            $newStatus = OrderStatus::OUT_FOR_DELIVERY;
        } elseif ($deliveryStatuses->contains('picked_up') || $statuses->contains(OrderStatus::PICKED_UP->value)) {
            $newStatus = OrderStatus::PICKED_UP;
        } elseif ($statuses->contains(OrderStatus::READY_FOR_PICKUP->value)) {
            $newStatus = OrderStatus::READY_FOR_PICKUP;
        } elseif ($statuses->contains(OrderStatus::PREPARING->value) || $statuses->contains(OrderStatus::PROCESSING->value)) {
            $newStatus = OrderStatus::PROCESSING;
        } elseif ($statuses->contains(OrderStatus::ACCEPTED->value) || $statuses->contains(OrderStatus::CONFIRMED->value)) {
            $newStatus = OrderStatus::CONFIRMED;
        }

        if ($newStatus !== null && $order->status !== $newStatus) {
            $from = $order->status->value;
            $updates = ['status' => $newStatus];
            if ($newStatus === OrderStatus::DELIVERED) {
                $updates['completed_at'] = $order->completed_at ?? now();
            } elseif ($newStatus === OrderStatus::CANCELLED) {
                $updates['cancelled_at'] = $order->cancelled_at ?? now();
                $updates['cancelled_reason'] = $order->cancelled_reason ?? 'All vendor orders were cancelled or rejected.';
            }

            $order->update($updates);
            $this->logStatus($order, $from, $newStatus->value, $actor, 'Order status synced from vendor order updates.');
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
