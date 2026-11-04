<?php

namespace App\Modules\Order\Application\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Application\Services\NotificationDispatcher;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Infrastructure\Models\ReturnRequestMedia;
use App\Modules\Order\Infrastructure\Models\ReturnStatusHistory;
use App\Modules\Shared\Domain\Enums\InspectionCondition;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ReturnRequestType;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class ReturnService
{
    public function __construct(
        private readonly NotificationDispatcher $notifications,
    ) {}

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1 – Customer submits a return request
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Create a new return / exchange / replacement request.
     *
     * @param  User   $customer
     * @param  array{
     *   order_id: string,
     *   order_item_id: string,
     *   request_type: string,
     *   reason_type: string,
     *   reason: string,
     *   quantity: int,
     *   preferred_resolution: ?string,
     *   return_method: ?string,
     * } $data
     * @param  UploadedFile[] $mediaFiles
     */
    public function createRequest(User $customer, array $data, array $mediaFiles = []): ReturnRequest
    {
        // ── Fetch & validate order ownership ──────────────────────────────
        $order = Order::query()
            ->where(function ($q) use ($data) {
                $q->where('uuid', $data['order_id']);
                if (is_numeric($data['order_id'])) {
                    $q->orWhere('id', (int) $data['order_id']);
                }
            })
            ->where('user_id', $customer->id)
            ->first();

        if (! $order) {
            throw new DomainException('Order not found.', 404);
        }

        $orderItem = OrderItem::query()
            ->where(function ($q) use ($data) {
                $q->where('uuid', $data['order_item_id']);
                if (is_numeric($data['order_item_id'])) {
                    $q->orWhere('id', (int) $data['order_item_id']);
                }
            })
            ->where('order_id', $order->id)
            ->first();

        if (! $orderItem) {
            throw new DomainException('Order item not found for this order.', 404);
        }

        // ── STEP 4: System eligibility check ──────────────────────────────
        $this->assertEligible($order, $orderItem, $data);

        // ── Prevent duplicate open requests ───────────────────────────────
        $openExists = ReturnRequest::query()
            ->where('order_item_id', $orderItem->id)
            ->whereNotIn('status', [
                ReturnStatus::CANCELLED,
                ReturnStatus::REJECTED,
                ReturnStatus::REFUNDED,
                ReturnStatus::COMPLETED,
            ])
            ->exists();

        if ($openExists) {
            throw new DomainException('An open return request already exists for this item.', 422);
        }

        $vendorOrder = $orderItem->vendorOrder;
        $windowExpiresAt = OrderReturnWindow::expiresAt($order);

        if (! $windowExpiresAt) {
            throw new DomainException(
                'The delivery date is unavailable. Please contact support.',
                422
            );
        }

        return DB::transaction(function () use ($customer, $data, $mediaFiles, $order, $orderItem, $vendorOrder, $windowExpiresAt) {
            $unitPrice = (float) $orderItem->line_total / max(1, (int) $orderItem->quantity);
            $qty = (int) $data['quantity'];

            $return = ReturnRequest::create([
                'return_number'        => ReferenceNumber::unique('RTN'),
                'user_id'              => $customer->id,
                'order_id'             => $order->id,
                'order_item_id'        => $orderItem->id,
                'vendor_order_id'      => $orderItem->vendor_order_id,
                'store_id'             => $vendorOrder?->store_id,
                'vendor_id'            => $orderItem->vendor_id,
                'request_type'         => isset($data['request_type']) ? (ReturnRequestType::tryFrom($data['request_type']) ?? ReturnRequestType::RETURN_REFUND) : ReturnRequestType::RETURN_REFUND,
                'reason_type'          => $data['reason_type'],
                'reason'               => $data['reason'],
                'quantity'             => $qty,
                'refund_amount'        => round($unitPrice * $qty, 2),
                'preferred_resolution' => $data['preferred_resolution'] ?? null,
                'return_method'        => $data['return_method'] ?? null,
                'status'               => ReturnStatus::REQUESTED,
                'window_expires_at'    => $windowExpiresAt,
            ]);

            // Record initial status history
            $this->recordHistory($return, null, ReturnStatus::REQUESTED, $customer, 'Request submitted by customer.');

            // Upload media files (photos / videos)
            if (! empty($mediaFiles)) {
                $this->attachMedia($return, $mediaFiles, $customer);
            }

            // Notify customer + vendor/admin
            $this->notifications->returnRequested($return);

            return $return->load(['orderItem.product', 'order', 'media']);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2 – Customer uploads additional media after request
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @param  UploadedFile[] $files
     */
    public function uploadMedia(ReturnRequest $return, array $files, User $uploader): void
    {
        if ($return->status->isTerminal()) {
            throw new DomainException('Cannot upload media for a closed request.', 422);
        }

        $this->attachMedia($return, $files, $uploader);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 5 – Seller (or admin) reviews and approves / rejects
    // ═══════════════════════════════════════════════════════════════════════

    public function approve(ReturnRequest $return, User $reviewer, string $notes = '', ?string $returnMethod = null, ?string $pickupInstructions = null): ReturnRequest
    {
        $this->assertNotTerminal($return, 'approve');
        if ($return->status !== ReturnStatus::REQUESTED && $return->status !== ReturnStatus::UNDER_REVIEW) {
            throw new DomainException('Request must be in requested or under_review status to approve.', 422);
        }

        return DB::transaction(function () use ($return, $reviewer, $notes, $returnMethod, $pickupInstructions) {
            $old = $return->status;

            $return->status            = ReturnStatus::APPROVED;
            $return->reviewed_by       = $reviewer->id;
            $return->reviewed_at       = now();
            $return->review_notes      = $notes ?: 'Approved.';
            if ($returnMethod) {
                $return->return_method      = $returnMethod;
                $return->pickup_instructions = $pickupInstructions;
            }
            $return->save();

            $this->recordHistory($return, $old, ReturnStatus::APPROVED, $reviewer, $notes);

            // ── STEP 6 – Arrange return pickup ───────────────────────────
            // If a return method was set, move to PICKUP_ARRANGED
            if ($returnMethod) {
                $old2 = $return->status;
                $return->status = ReturnStatus::PICKUP_ARRANGED;
                $return->save();
                $this->recordHistory($return, $old2, ReturnStatus::PICKUP_ARRANGED, $reviewer, 'Return logistics communicated to customer.');
            }

            $this->notifications->returnStatusChanged($return, $reviewer);

            return $return->fresh();
        });
    }

    public function reject(ReturnRequest $return, User $reviewer, string $reason): ReturnRequest
    {
        $this->assertNotTerminal($return, 'reject');

        return DB::transaction(function () use ($return, $reviewer, $reason) {
            $old = $return->status;
            $return->status       = ReturnStatus::REJECTED;
            $return->reviewed_by  = $reviewer->id;
            $return->reviewed_at  = now();
            $return->review_notes = $reason;
            $return->save();

            $this->recordHistory($return, $old, ReturnStatus::REJECTED, $reviewer, $reason);
            $this->notifications->returnStatusChanged($return, $reviewer);

            return $return->fresh();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 6 – Mark product collected / received by seller
    // ═══════════════════════════════════════════════════════════════════════

    public function markCollected(ReturnRequest $return, User $actor, string $notes = ''): ReturnRequest
    {
        if (! in_array($return->status, [ReturnStatus::APPROVED, ReturnStatus::PICKUP_ARRANGED], true)) {
            throw new DomainException('Return must be approved before marking as collected.', 422);
        }

        return DB::transaction(function () use ($return, $actor, $notes) {
            $old = $return->status;
            $return->status               = ReturnStatus::COLLECTED;
            $return->pickup_collected_at  = now();
            $return->pickup_collected_by  = $actor->id;
            $return->save();

            $this->recordHistory($return, $old, ReturnStatus::COLLECTED, $actor, $notes ?: 'Product received by seller.');
            $this->notifications->returnStatusChanged($return, $actor);

            return $return->fresh();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 7 – Seller inspects the returned product
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @param  UploadedFile[] $inspectionPhotos
     */
    public function recordInspection(
        ReturnRequest $return,
        User $inspector,
        string $condition,
        string $notes,
        array $inspectionPhotos = []
    ): ReturnRequest {
        if ($return->status !== ReturnStatus::COLLECTED) {
            throw new DomainException('Product must be collected before inspection.', 422);
        }

        return DB::transaction(function () use ($return, $inspector, $condition, $notes, $inspectionPhotos) {
            // Store inspection photos
            $photoPaths = [];
            foreach ($inspectionPhotos as $photo) {
                $path = $photo->store("returns/{$return->id}/inspection", 'public');
                $photoPaths[] = $path;
            }

            $old = $return->status;
            $return->inspection_condition = InspectionCondition::from($condition);
            $return->inspection_notes     = $notes;
            $return->inspection_photos    = $photoPaths ?: null;
            $return->inspected_at         = now();
            $return->inspected_by         = $inspector->id;
            $return->status               = ReturnStatus::INSPECTED;
            $return->save();

            $this->recordHistory($return, $old, ReturnStatus::INSPECTED, $inspector,
                "Inspection: {$condition}. {$notes}"
            );
            $this->notifications->returnStatusChanged($return, $inspector);

            return $return->fresh();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 8 – Complete the request (exchange / replacement / refund)
    // ═══════════════════════════════════════════════════════════════════════

    /** Mark exchange product dispatched */
    public function dispatchExchange(ReturnRequest $return, User $actor, ?int $exchangeOrderId = null, string $notes = ''): ReturnRequest
    {
        if (! $return->isExchange()) {
            throw new DomainException('This request is not an exchange.', 422);
        }
        if ($return->status !== ReturnStatus::INSPECTED) {
            throw new DomainException('Product must be inspected before dispatching exchange.', 422);
        }

        return DB::transaction(function () use ($return, $actor, $exchangeOrderId, $notes) {
            $old = $return->status;
            $return->status                 = ReturnStatus::EXCHANGE_DISPATCHED;
            $return->exchange_order_id      = $exchangeOrderId;
            $return->exchange_dispatched_at = now();
            $return->save();

            $this->recordHistory($return, $old, ReturnStatus::EXCHANGE_DISPATCHED, $actor, $notes ?: 'Exchange product dispatched.');
            $this->notifications->returnStatusChanged($return, $actor);

            return $return->fresh();
        });
    }

    /** Mark replacement product dispatched */
    public function dispatchReplacement(ReturnRequest $return, User $actor, string $notes = ''): ReturnRequest
    {
        if (! $return->isReplacement()) {
            throw new DomainException('This request is not a replacement.', 422);
        }
        if ($return->status !== ReturnStatus::INSPECTED) {
            throw new DomainException('Product must be inspected before dispatching replacement.', 422);
        }

        return DB::transaction(function () use ($return, $actor, $notes) {
            $old = $return->status;
            $return->status                      = ReturnStatus::REPLACEMENT_DISPATCHED;
            $return->replacement_dispatched_at   = now();
            $return->save();

            $this->recordHistory($return, $old, ReturnStatus::REPLACEMENT_DISPATCHED, $actor, $notes ?: 'Replacement dispatched.');
            $this->notifications->returnStatusChanged($return, $actor);

            return $return->fresh();
        });
    }

    /** Close request as completed */
    public function close(ReturnRequest $return, User $actor, string $notes = ''): ReturnRequest
    {
        $closeable = [
            ReturnStatus::EXCHANGE_DISPATCHED,
            ReturnStatus::REPLACEMENT_DISPATCHED,
            ReturnStatus::REFUNDED,
        ];

        if (! in_array($return->status, $closeable, true)) {
            throw new DomainException('Request cannot be closed in its current state.', 422);
        }

        return DB::transaction(function () use ($return, $actor, $notes) {
            $old = $return->status;
            $return->status    = ReturnStatus::COMPLETED;
            $return->closed_at = now();
            $return->save();

            $this->recordHistory($return, $old, ReturnStatus::COMPLETED, $actor, $notes ?: 'Request closed.');
            $this->notifications->returnStatusChanged($return, $actor);

            return $return->fresh();
        });
    }

    /** Customer cancels their own request */
    public function cancel(ReturnRequest $return, User $customer, string $reason = ''): ReturnRequest
    {
        if (! $return->status->isCancellableByCustomer()) {
            throw new DomainException('This request cannot be cancelled anymore.', 422);
        }
        if ($return->user_id !== $customer->id) {
            throw new DomainException('Unauthorized.', 403);
        }

        return DB::transaction(function () use ($return, $customer, $reason) {
            $old = $return->status;
            $return->status = ReturnStatus::CANCELLED;
            $return->save();

            $this->recordHistory($return, $old, ReturnStatus::CANCELLED, $customer, $reason ?: 'Cancelled by customer.');
            $this->notifications->returnStatusChanged($return, $customer);

            return $return->fresh();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Generic status update (admin / vendor convenience)
    // ═══════════════════════════════════════════════════════════════════════

    public function updateStatus(ReturnRequest $return, User $actor, ReturnStatus $newStatus, string $notes = ''): ReturnRequest
    {
        if ($return->status->isTerminal()) {
            throw new DomainException('Request is already in a terminal state.', 422);
        }

        return DB::transaction(function () use ($return, $actor, $newStatus, $notes) {
            $old = $return->status;
            $return->status = $newStatus;

            if (in_array($newStatus, [ReturnStatus::APPROVED, ReturnStatus::REJECTED, ReturnStatus::UNDER_REVIEW], true)) {
                $return->reviewed_by  = $return->reviewed_by ?? $actor->id;
                $return->reviewed_at  = $return->reviewed_at ?? now();
                $return->review_notes = $notes ?: $return->review_notes;
            }

            if ($newStatus === ReturnStatus::COMPLETED) {
                $return->closed_at = now();
            }

            $return->save();

            $this->recordHistory($return, $old, $newStatus, $actor, $notes);
            $this->notifications->returnStatusChanged($return, $actor);

            return $return->fresh();
        });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Private helpers
    // ═══════════════════════════════════════════════════════════════════════

    private function assertEligible(Order $order, OrderItem $orderItem, array $data): void
    {
        // Must be delivered or completed
        $vendorOrder = $orderItem->vendorOrder;
        $deliveredStatuses = [OrderStatus::DELIVERED, OrderStatus::COMPLETED];

        if (
            ! in_array($order->status, $deliveredStatuses, true)
            || ! $vendorOrder
            || ! in_array($vendorOrder->status, $deliveredStatuses, true)
        ) {
            throw new DomainException(
                'Returns can only be requested after the order has been delivered.',
                422
            );
        }

        // Check return window
        $windowExpiresAt = OrderReturnWindow::expiresAt($order);
        if (! $windowExpiresAt) {
            throw new DomainException('Delivery date is unavailable. Please contact support.', 422);
        }

        if (now()->greaterThanOrEqualTo($windowExpiresAt)) {
            throw new DomainException(
                'The return and refund window for this order has expired.',
                422,
                ['window_expired_at' => $windowExpiresAt->toISOString()]
            );
        }

        // Quantity check
        if ((int) $data['quantity'] > (int) $orderItem->quantity) {
            throw new DomainException('Return quantity exceeds purchased quantity.', 422);
        }

        // Exchange/replacement: require a reason (they always need description)
        $requestType = isset($data['request_type'])
            ? (ReturnRequestType::tryFrom($data['request_type']) ?? ReturnRequestType::RETURN_REFUND)
            : ReturnRequestType::RETURN_REFUND;
    }

    private function assertNotTerminal(ReturnRequest $return, string $action): void
    {
        if ($return->status->isTerminal()) {
            throw new DomainException(
                "Cannot {$action} a request that is already in terminal state ({$return->status->value}).",
                422
            );
        }
    }

    /**
     * @param  UploadedFile[] $files
     */
    private function attachMedia(ReturnRequest $return, array $files, User $uploader): void
    {
        try {
            if (! Schema::hasTable('return_request_media')) {
                return;
            }
        } catch (\Throwable) {
            return;
        }

        foreach ($files as $file) {
            if (! ($file instanceof \Illuminate\Http\UploadedFile)) {
                continue;
            }

            $path = $file->store("returns/{$return->id}/media", 'public');

            try {
                ReturnRequestMedia::create([
                    'return_request_id' => $return->id,
                    'type'              => str_starts_with($file->getMimeType() ?? '', 'video/') ? 'video' : 'photo',
                    'path'              => $path,
                    'mime_type'         => $file->getMimeType(),
                    'size'              => $file->getSize(),
                    'original_name'     => $file->getClientOriginalName(),
                    'uploaded_by'       => $uploader->id,
                ]);
            } catch (\Throwable) {
                // Silently continue if media table insert fails
            }
        }
    }

    private function recordHistory(
        ReturnRequest $return,
        ?ReturnStatus $from,
        ReturnStatus $to,
        ?User $actor,
        string $notes = ''
    ): void {
        try {
            if (! Schema::hasTable('return_status_histories')) {
                return;
            }

            ReturnStatusHistory::create([
                'return_request_id' => $return->id,
                'from_status'       => $from?->value,
                'to_status'         => $to->value,
                'notes'             => $notes,
                'changed_by'        => $actor?->id,
            ]);
        } catch (\Throwable) {
            // Silently continue if history table is unavailable
        }
    }
}
