<?php

namespace App\Modules\Payment\Application\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Payment\Infrastructure\Models\PaymentStatusHistory;
use App\Modules\Payment\Infrastructure\Models\Refund;
use App\Modules\Shared\Domain\Enums\PaymentStatus;
use App\Modules\Shared\Domain\Enums\RefundStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use Illuminate\Support\Facades\DB;

class RefundService
{
    public function create(Payment $payment, User $actor, float $amount, ?string $reason): Refund
    {
        if (! $payment->isPaid()) {
            throw new DomainException('Only paid payments can be refunded.', 422);
        }

        $already = $payment->refunds()->whereIn('status', [RefundStatus::REQUESTED->value, RefundStatus::APPROVED->value, RefundStatus::PROCESSING->value])->sum('amount');

        if ($already + $amount > (float) $payment->amount) {
            throw new DomainException('Refund amount exceeds the payment balance.', 422);
        }

        return DB::transaction(function () use ($payment, $actor, $amount, $reason) {
            $refund = new Refund();
            $refund->refund_number = ReferenceNumber::unique('REF');
            $refund->payment_id = $payment->id;
            $refund->order_id = $payment->order_id;
            $refund->vendor_order_id = $payment->vendor_order_id;
            $refund->amount = round($amount, 2);
            $refund->reason = $reason;
            $refund->status = RefundStatus::REQUESTED;
            $refund->initiated_by = $actor->id;
            $refund->initiated_at = now();
            $refund->save();

            PaymentStatusHistory::create([
                'payment_id' => $payment->id,
                'from_status' => $payment->status->value,
                'to_status' => $payment->status->value,
                'reason' => "Refund requested: {$refund->refund_number} (".number_format($amount, 2).').',
                'actor_user_id' => $actor->id,
            ]);

            return $refund;
        });
    }

    public function approve(User $actor, Refund $refund): Refund
    {
        if (! in_array($refund->status->value, [RefundStatus::REQUESTED->value, RefundStatus::PROCESSING->value], true)) {
            throw new DomainException('Refund is not in a requestable state.', 422);
        }

        return DB::transaction(function () use ($actor, $refund) {
            $refund->status = RefundStatus::APPROVED;
            $refund->initiated_by = $refund->initiated_by ?? $actor->id;
            $refund->completed_at = now();
            $refund->save();

            $payment = $refund->payment;

            if ($payment) {
                $from = $payment->status;
                $payment->status = PaymentStatus::REFUNDED;
                $payment->save();

                PaymentStatusHistory::create([
                    'payment_id' => $payment->id,
                    'from_status' => $from->value,
                    'to_status' => PaymentStatus::REFUNDED->value,
                    'reason' => "Refund approved: {$refund->refund_number}.",
                    'actor_user_id' => $actor->id,
                ]);
            }

            return $refund->load('payment', 'order', 'orderItem');
        });
    }

    public function reject(User $actor, Refund $refund, ?string $reason): Refund
    {
        if (! in_array($refund->status->value, [RefundStatus::REQUESTED->value, RefundStatus::PROCESSING->value], true)) {
            throw new DomainException('Refund is not in a requestable state.', 422);
        }

        $refund->status = RefundStatus::CANCELLED;
        $refund->reason = trim(($refund->reason ?? '').($reason ? " — {$reason}" : ''));
        $refund->completed_at = now();
        $refund->save();

        return $refund->load('payment', 'order', 'orderItem');
    }
}
