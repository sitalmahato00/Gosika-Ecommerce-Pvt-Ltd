<?php

namespace App\Modules\Shared\Domain\Enums;

enum ReturnStatus: string
{
    case REQUESTED          = 'requested';
    case UNDER_REVIEW       = 'under_review';
    case APPROVED           = 'approved';
    case REJECTED           = 'rejected';
    case PICKUP_ARRANGED    = 'pickup_arranged';    // Return logistics communicated to customer
    case COLLECTED          = 'collected';          // Product picked up / received by seller
    case INSPECTED          = 'inspected';          // Seller completed inspection
    case EXCHANGE_DISPATCHED   = 'exchange_dispatched';    // Exchange product sent
    case REPLACEMENT_DISPATCHED = 'replacement_dispatched'; // Replacement product sent
    case REFUND_PENDING     = 'refund_pending';
    case REFUNDED           = 'refunded';
    case COMPLETED          = 'completed';          // Final closed state
    case CANCELLED          = 'cancelled';

    public function label(): string
    {
        return match($this) {
            self::REQUESTED             => 'Requested',
            self::UNDER_REVIEW          => 'Under Review',
            self::APPROVED              => 'Approved',
            self::REJECTED              => 'Rejected',
            self::PICKUP_ARRANGED       => 'Pickup Arranged',
            self::COLLECTED             => 'Collected',
            self::INSPECTED             => 'Inspected',
            self::EXCHANGE_DISPATCHED   => 'Exchange Dispatched',
            self::REPLACEMENT_DISPATCHED => 'Replacement Dispatched',
            self::REFUND_PENDING        => 'Refund Pending',
            self::REFUNDED              => 'Refunded',
            self::COMPLETED             => 'Completed',
            self::CANCELLED             => 'Cancelled',
        };
    }

    /** Statuses a customer can cancel from */
    public function isCancellableByCustomer(): bool
    {
        return in_array($this, [self::REQUESTED, self::UNDER_REVIEW], true);
    }

    /** Final (terminal) statuses */
    public function isTerminal(): bool
    {
        return in_array($this, [
            self::REJECTED,
            self::REFUNDED,
            self::COMPLETED,
            self::CANCELLED,
        ], true);
    }
}
