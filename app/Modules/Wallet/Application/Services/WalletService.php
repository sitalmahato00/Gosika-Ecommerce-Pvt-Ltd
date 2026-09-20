<?php

namespace App\Modules\Wallet\Application\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\CommissionStatus;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PayoutStatus;
use App\Modules\Shared\Domain\Enums\SettlementStatus;
use App\Modules\Shared\Domain\Enums\WalletTransactionType;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Infrastructure\Models\Commission;
use App\Modules\Wallet\Infrastructure\Models\PayoutRecord;
use App\Modules\Wallet\Infrastructure\Models\PayoutRequest;
use App\Modules\Wallet\Infrastructure\Models\Settlement;
use App\Modules\Wallet\Infrastructure\Models\VendorWallet;
use App\Modules\Wallet\Infrastructure\Models\WalletTransaction;
use App\Modules\Marketing\Application\Services\NotificationDispatcher;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class WalletService
{
    public function __construct(
        protected NotificationDispatcher $dispatcher,
    ) {
    }

    public function walletForVendor(Vendor $vendor): VendorWallet
    {
        return $this->ensureWallet($vendor);
    }

    public function ensureWallet(Vendor $vendor): VendorWallet
    {
        $wallet = VendorWallet::query()->firstOrNew(['vendor_id' => $vendor->id]);

        if (! $wallet->exists) {
            $wallet->balance = 0;
            $wallet->available_balance = 0;
            $wallet->pending_balance = 0;
            $wallet->currency = 'NPR';
            $wallet->version = 1;
            $wallet->save();
        }

        return $wallet;
    }

    public function recordCommission(VendorOrder $vendorOrder, ?int $actorUserId = null): Commission
    {
        $commission = Commission::query()->firstOrNew(['vendor_order_id' => $vendorOrder->id]);

        if (! $commission->exists) {
            $commission->order_id = $vendorOrder->order_id;
            $commission->vendor_id = $vendorOrder->vendor_id;
            $commission->rate = $vendorOrder->commission_rate;
            $commission->basis_amount = $vendorOrder->grand_total;
            $commission->amount = $vendorOrder->commission_amount;
            $commission->status = CommissionStatus::CALCULATED;
            $commission->calculated_at = now();
            $commission->created_by = $actorUserId;
            $commission->save();
        }

        return $commission;
    }

    public function creditEarnings(VendorOrder $vendorOrder): Commission
    {
        if (! $this->isEligibleForEarnings($vendorOrder)) {
            throw new DomainException('Order is not yet eligible for earnings credit.', 422);
        }

        return DB::transaction(function () use ($vendorOrder) {
            $commission = $this->recordCommission($vendorOrder);

            if ($commission->status->value !== CommissionStatus::EARNED->value) {
                $wallet = $this->lockWallet($vendorOrder->vendor_id);
                $amount = (float) $vendorOrder->vendor_payable;

                $this->mutate($wallet, function (VendorWallet $wallet) use ($amount) {
                    $wallet->balance = round((float) $wallet->balance + $amount, 2);
                    $wallet->pending_balance = round((float) $wallet->pending_balance + $amount, 2);
                });

                $this->ledger($wallet, WalletTransactionType::CREDIT_EARNINGS, $amount, [
                    'reference_type' => 'vendor_order',
                    'reference_id' => $vendorOrder->id,
                    'description' => 'Earnings from order '.$vendorOrder->order?->order_number,
                ]);

                $commission->status = CommissionStatus::EARNED;
                $commission->save();
            }

            return $commission->fresh();
        });
    }

    public function settleVendor(Vendor $vendor, Carbon $periodStart, Carbon $periodEnd): Settlement
    {
        return DB::transaction(function () use ($vendor, $periodStart, $periodEnd) {
            $eligible = $this->eligibleVendorOrders($vendor, $periodStart, $periodEnd);

            if ($eligible->isEmpty()) {
                throw new DomainException('No eligible vendor orders found for the given period.', 422);
            }

            foreach ($eligible as $vendorOrder) {
                $this->creditEarnings($vendorOrder);
            }

            $grossSales = round($eligible->sum('grand_total'), 2);
            $commissionTotal = round($eligible->sum('commission_amount'), 2);
            $refundsTotal = 0.0;
            $adjustmentsTotal = 0.0;
            $netPayable = round($grossSales - $commissionTotal, 2);

            $settlement = new Settlement();
            $settlement->settlement_number = ReferenceNumber::unique('SET');
            $settlement->vendor_id = $vendor->id;
            $settlement->period_start = $periodStart->toDateString();
            $settlement->period_end = $periodEnd->toDateString();
            $settlement->gross_sales = $grossSales;
            $settlement->commission_total = $commissionTotal;
            $settlement->refunds_total = $refundsTotal;
            $settlement->adjustments_total = $adjustmentsTotal;
            $settlement->net_payable = $netPayable;
            $settlement->status = SettlementStatus::ELIGIBLE;
            $settlement->hold_reason = null;
            $settlement->generated_at = now();
            $settlement->meta = [
                'vendor_order_ids' => $eligible->pluck('id')->map(fn ($id) => (string) $id)->all(),
            ];
            $settlement->save();

            $this->dispatcher->settlementNotice($settlement, 'eligible');

            return $settlement->fresh();
        });
    }

    public function holdSettlement(Settlement $settlement, User $user, string $reason): Settlement
    {
        if (! in_array($settlement->status->value, [SettlementStatus::ELIGIBLE->value, SettlementStatus::PROCESSING->value], true)) {
            throw new DomainException('Only eligible or processing settlements can be placed on hold.', 422);
        }

        return DB::transaction(function () use ($settlement, $user, $reason) {
            $settlement->status = SettlementStatus::HOLD;
            $settlement->hold_reason = $reason;
            $settlement->updated_by = $user->id;
            $settlement->save();

            $this->dispatcher->settlementNotice($settlement, 'held');

            return $settlement->fresh(['vendor']);
        });
    }

    public function releaseSettlement(Settlement $settlement, User $user): Settlement
    {
        if ($settlement->status->value !== SettlementStatus::HOLD->value) {
            throw new DomainException('Only held settlements can be released.', 422);
        }

        return DB::transaction(function () use ($settlement, $user) {
            $hasOpenPayout = $settlement->payoutRequests()
                ->whereIn('status', [
                    PayoutStatus::PENDING->value,
                    PayoutStatus::APPROVED->value,
                    PayoutStatus::PROCESSING->value,
                ])
                ->exists();

            $settlement->status = $hasOpenPayout ? SettlementStatus::PROCESSING : SettlementStatus::ELIGIBLE;
            $settlement->hold_reason = null;
            $settlement->updated_by = $user->id;
            $settlement->save();

            $this->dispatcher->settlementNotice($settlement, 'released');

            return $settlement->fresh(['vendor']);
        });
    }

    public function distributeSettlement(Settlement $settlement, User $user): Settlement
    {
        if (! in_array($settlement->status->value, [SettlementStatus::ELIGIBLE->value, SettlementStatus::PROCESSING->value], true)) {
            throw new DomainException('Only eligible or processing settlements can be distributed.', 422);
        }

        return DB::transaction(function () use ($settlement, $user) {
            $settlement = $settlement->fresh();
            $status = $settlement->status->value;

            if ($status === SettlementStatus::ELIGIBLE->value) {
                $hasOpenPayout = $settlement->payoutRequests()
                    ->whereIn('status', [
                        PayoutStatus::PENDING->value,
                        PayoutStatus::APPROVED->value,
                        PayoutStatus::PROCESSING->value,
                    ])
                    ->exists();

                if ($hasOpenPayout) {
                    throw new DomainException('Settlement has an active payout request. Approve and distribute it via the payout, or reject the payout first.', 422);
                }

                $wallet = $this->lockWallet($settlement->vendor_id);
                $amount = round((float) $settlement->net_payable, 2);

                $this->mutate($wallet, function (VendorWallet $wallet) use ($amount) {
                    $wallet->pending_balance = round((float) $wallet->pending_balance - $amount, 2);
                    $wallet->available_balance = round((float) $wallet->available_balance + $amount, 2);
                });

                $this->ledger($wallet, WalletTransactionType::CREDIT_SETTLEMENT, $amount, [
                    'reference_type' => 'settlement',
                    'reference_id' => $settlement->id,
                    'description' => 'Distributed settlement '.$settlement->settlement_number.' to available balance',
                ]);
            } else {
                $payout = $settlement->payoutRequests()
                    ->whereIn('status', [
                        PayoutStatus::PENDING->value,
                        PayoutStatus::APPROVED->value,
                        PayoutStatus::PROCESSING->value,
                    ])
                    ->orderBy('id')
                    ->first();

                if ($payout) {
                    $record = new PayoutRecord();
                    $record->payout_request_id = $payout->id;
                    $record->provider_reference = null;
                    $record->amount = (float) $payout->amount;
                    $record->fee = 0.00;
                    $record->net_amount = (float) $payout->amount;
                    $record->status = 'paid';
                    $record->paid_at = now();
                    $record->created_by = $user->id;
                    $record->save();

                    $payout->status = PayoutStatus::PAID;
                    $payout->paid_at = now();
                    $payout->updated_by = $user->id;
                    $payout->save();
                }
            }

            $settlement->status = SettlementStatus::PAID;
            $settlement->paid_at = now();
            $settlement->updated_by = $user->id;
            $settlement->save();

            $this->dispatcher->settlementNotice($settlement, 'distributed');

            return $settlement->fresh(['vendor']);
        });
    }

    public function eligibleSettlementsFor(Vendor $vendor): Collection
    {
        return Settlement::query()
            ->where('vendor_id', $vendor->id)
            ->where('status', SettlementStatus::ELIGIBLE->value)
            ->with(['payoutRequests'])
            ->orderByDesc('id')
            ->get()
            ->filter(fn (Settlement $settlement) => $this->isRequestable($settlement));
    }

    public function requestPayout(Settlement $settlement, ?int $bankAccountId, User $user): PayoutRequest
    {
        if (! $this->isRequestable($settlement)) {
            throw new DomainException('Only eligible settlements with a completed cycle can be requested for payout.', 422);
        }

        $amount = round((float) $settlement->net_payable, 2);

        if ($amount <= 0) {
            throw new DomainException('Settlement net payable must be greater than zero.', 422);
        }

        if ($bankAccountId) {
            $exists = BankAccount::query()->where('vendor_id', $settlement->vendor_id)->where('id', $bankAccountId)->exists();

            if (! $exists) {
                throw new DomainException('Selected bank account does not belong to this vendor.', 422);
            }
        }

        return DB::transaction(function () use ($settlement, $bankAccountId, $user, $amount) {
            // Lock the settlement row for update first. Every payout creation flows
            // through this method, so concurrent requests for the same settlement
            // serialize here and the re-check below sees the already-committed payout.
            $settlement = Settlement::query()->whereKey($settlement->getKey())->lockForUpdate()->firstOrFail();

            if (! $this->isRequestable($settlement)) {
                throw new DomainException('Only eligible settlements with a completed cycle can be requested for payout.', 422);
            }

            $wallet = $this->lockWallet($settlement->vendor_id);

            $payout = new PayoutRequest();
            $payout->payout_number = ReferenceNumber::unique('PO');
            $payout->vendor_id = $settlement->vendor_id;
            $payout->settlement_id = $settlement->id;
            $payout->wallet_id = $wallet->id;
            $payout->bank_account_id = $bankAccountId;
            $payout->amount = $amount;
            $payout->status = PayoutStatus::PENDING;
            $payout->requested_at = now();
            $payout->created_by = $user->id;
            $payout->save();

            $this->mutate($wallet, function (VendorWallet $wallet) use ($amount) {
                $wallet->pending_balance = round((float) $wallet->pending_balance - $amount, 2);
                $wallet->balance = round((float) $wallet->balance - $amount, 2);
            });

            $this->ledger($wallet, WalletTransactionType::DEBIT_WITHDRAWAL, $amount, [
                'reference_type' => 'payout_request',
                'reference_id' => $payout->id,
                'description' => 'Payout requested '.$payout->payout_number.' (reserved from settlement '.$settlement->settlement_number.')',
                'status' => 'held',
            ]);

            $this->dispatcher->payoutRequested($payout);

            return $payout->fresh(['bankAccount', 'settlement']);
        });
    }

    public function approvePayout(PayoutRequest $payout, User $user): PayoutRequest
    {
        $this->assertStatus($payout, PayoutStatus::PENDING, 'Only pending payouts can be approved.');

        return DB::transaction(function () use ($payout, $user) {
            $payout->status = PayoutStatus::APPROVED;
            $payout->approved_by = $user->id;
            $payout->approved_at = now();
            $payout->updated_by = $user->id;
            $payout->save();

            if ($payout->settlement && $payout->settlement->status->value === SettlementStatus::ELIGIBLE->value) {
                $payout->settlement->status = SettlementStatus::PROCESSING;
                $payout->settlement->hold_reason = null;
                $payout->settlement->save();
            }

            $this->dispatcher->payoutUpdated($payout, 'approved');

            return $payout->fresh(['bankAccount', 'settlement']);
        });
    }

    public function rejectPayout(PayoutRequest $payout, User $user, string $reason): PayoutRequest
    {
        $this->assertStatus($payout, PayoutStatus::PENDING, 'Only pending payouts can be rejected.');

        return DB::transaction(function () use ($payout, $user, $reason) {
            $wallet = $this->lockWallet($payout->vendor_id);

            $payout->status = PayoutStatus::REJECTED;
            $payout->rejection_reason = $reason;
            $payout->updated_by = $user->id;
            $payout->save();

            $this->mutate($wallet, function (VendorWallet $wallet) use ($payout) {
                $amount = (float) $payout->amount;
                $wallet->pending_balance = round((float) $wallet->pending_balance + $amount, 2);
                $wallet->balance = round((float) $wallet->balance + $amount, 2);
            });

            $this->ledger($wallet, WalletTransactionType::CREDIT_ADJUSTMENT, (float) $payout->amount, [
                'reference_type' => 'payout_request',
                'reference_id' => $payout->id,
                'description' => 'Rejected payout returned to pending '.$payout->payout_number,
            ]);

            $this->dispatcher->payoutUpdated($payout, 'rejected');

            return $payout->fresh(['bankAccount', 'settlement']);
        });
    }

    public function markPayoutPaid(PayoutRequest $payout, User $user, ?string $providerReference = null, float $fee = 0.0): PayoutRequest
    {
        $this->assertStatus($payout, PayoutStatus::APPROVED, 'Only approved payouts can be marked paid.');

        return DB::transaction(function () use ($payout, $user, $providerReference, $fee) {
            $record = new PayoutRecord();
            $record->payout_request_id = $payout->id;
            $record->provider_reference = $providerReference;
            $record->amount = $payout->amount;
            $record->fee = round($fee, 2);
            $record->net_amount = round((float) $payout->amount - (float) $fee, 2);
            $record->status = 'paid';
            $record->paid_at = now();
            $record->created_by = $user->id;
            $record->save();

            $payout->status = PayoutStatus::PAID;
            $payout->paid_at = now();
            $payout->updated_by = $user->id;
            $payout->save();

            if ($payout->settlement && $payout->settlement->status->value === SettlementStatus::PROCESSING->value) {
                $payout->settlement->status = SettlementStatus::PAID;
                $payout->settlement->paid_at = now();
                $payout->settlement->save();
            }

            $this->dispatcher->payoutUpdated($payout, 'paid');

            return $payout->fresh(['bankAccount', 'settlement', 'records']);
        });
    }

    public function cancelPayout(PayoutRequest $payout, User $user, ?string $reason = null): PayoutRequest
    {
        $this->assertStatus($payout, PayoutStatus::APPROVED, 'Only approved payouts can be cancelled.');

        return DB::transaction(function () use ($payout, $user, $reason) {
            $wallet = $this->lockWallet($payout->vendor_id);

            $payout->status = PayoutStatus::CANCELLED;
            $payout->rejection_reason = $reason;
            $payout->updated_by = $user->id;
            $payout->save();

            $this->mutate($wallet, function (VendorWallet $wallet) use ($payout) {
                $amount = (float) $payout->amount;
                $wallet->pending_balance = round((float) $wallet->pending_balance + $amount, 2);
                $wallet->balance = round((float) $wallet->balance + $amount, 2);
            });

            $this->ledger($wallet, WalletTransactionType::CREDIT_ADJUSTMENT, (float) $payout->amount, [
                'reference_type' => 'payout_request',
                'reference_id' => $payout->id,
                'description' => 'Cancelled payout returned to pending '.$payout->payout_number,
            ]);

            if ($payout->settlement && $payout->settlement->status->value === SettlementStatus::PROCESSING->value) {
                $payout->settlement->status = SettlementStatus::ELIGIBLE;
                $payout->settlement->save();
            }

            return $payout->fresh(['bankAccount', 'settlement']);
        });
    }

    public function adjustBalance(Vendor $vendor, float $amount, string $reason, User $user): VendorWallet
    {
        return DB::transaction(function () use ($vendor, $amount, $reason, $user) {
            $wallet = $this->lockWallet($vendor->id);

            $type = $amount >= 0 ? WalletTransactionType::CREDIT_ADJUSTMENT : WalletTransactionType::DEBIT_ADJUSTMENT;
            $absolute = abs($amount);

            $this->mutate($wallet, function (VendorWallet $wallet) use ($absolute, $amount) {
                $wallet->balance = round((float) $wallet->balance + $amount, 2);
                $wallet->available_balance = round((float) $wallet->available_balance + $amount, 2);
            });

            $this->ledger($wallet, $type, $absolute, [
                'reference_type' => 'manual_adjustment',
                'description' => $reason,
                'actor_user_id' => $user->id,
            ]);

            return $wallet->fresh();
        });
    }

    public function transactionsFor(Vendor $vendor): Collection
    {
        $wallet = $this->ensureWallet($vendor);

        return WalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->orderByDesc('id')
            ->get();
    }

    public function settlementsFor(Vendor $vendor): Collection
    {
        return Settlement::query()
            ->where('vendor_id', $vendor->id)
            ->with(['payoutRequests'])
            ->orderByDesc('id')
            ->get();
    }

    public function payoutsFor(Vendor $vendor): Collection
    {
        return PayoutRequest::query()
            ->where('vendor_id', $vendor->id)
            ->with(['bankAccount', 'records', 'settlement'])
            ->orderByDesc('id')
            ->get();
    }

    public function commissionsFor(Vendor $vendor): Collection
    {
        return Commission::query()
            ->where('vendor_id', $vendor->id)
            ->with(['order'])
            ->orderByDesc('id')
            ->get();
    }

    protected function isEligibleForEarnings(VendorOrder $vendorOrder): bool
    {
        $order = $vendorOrder->order;

        if (! $order) {
            return false;
        }

        if ($order->payment_status->value !== OrderPaymentStatus::PAID->value) {
            return false;
        }

        if (! in_array($vendorOrder->status->value, [OrderStatus::DELIVERED->value, OrderStatus::COMPLETED->value], true)) {
            return false;
        }

        return $this->returnWindowElapsed($order);
    }

    protected function returnWindowElapsed(Order $order): bool
    {
        $days = (int) Setting::get('return.window_days', 7);
        $completedAt = $order->completed_at ?? $order->updated_at ?? now();

        return $completedAt->copy()->addDays($days)->lte(now());
    }

    protected function eligibleVendorOrders(Vendor $vendor, Carbon $periodStart, Carbon $periodEnd): Collection
    {
        $settledOrderIds = Settlement::query()
            ->where('vendor_id', $vendor->id)
            ->get()
            ->flatMap(fn (Settlement $settlement) => $settlement->meta['vendor_order_ids'] ?? [])
            ->map(fn ($id) => (int) $id)
            ->all();

        return VendorOrder::query()
            ->where('vendor_id', $vendor->id)
            ->whereNotIn('id', $settledOrderIds)
            ->with(['order'])
            ->get()
            ->filter(function (VendorOrder $vendorOrder) use ($periodStart, $periodEnd) {
                $order = $vendorOrder->order;

                if (! $this->isEligibleForEarnings($vendorOrder)) {
                    return false;
                }

                $completedAt = $order?->completed_at ?? $order?->updated_at;

                return $completedAt && $completedAt->between($periodStart, $periodEnd);
            });
    }

    protected function lockWallet(int $vendorId): VendorWallet
    {
        $wallet = VendorWallet::query()
            ->where('vendor_id', $vendorId)
            ->lockForUpdate()
            ->first();

        if (! $wallet) {
            $vendor = Vendor::query()->findOrFail($vendorId);

            return $this->ensureWallet($vendor);
        }

        return $wallet;
    }

    protected function mutate(VendorWallet $wallet, callable $callback): void
    {
        $callback($wallet);
        $wallet->version = ((int) $wallet->version) + 1;
        $wallet->save();
    }

    protected function ledger(VendorWallet $wallet, WalletTransactionType $type, float $amount, array $extra = []): WalletTransaction
    {
        $balanceAfter = (float) $wallet->balance;

        return WalletTransaction::query()->create(array_merge([
            'wallet_id' => $wallet->id,
            'transaction_type' => $type->value,
            'amount' => $amount,
            'balance_before' => round($balanceAfter - $amount, 2),
            'balance_after' => $balanceAfter,
            'status' => 'completed',
            'description' => $extra['description'] ?? $type->value,
            'meta' => $extra['meta'] ?? [],
            'created_by' => $extra['actor_user_id'] ?? null,
        ], [
            'reference_type' => $extra['reference_type'] ?? null,
            'reference_id' => $extra['reference_id'] ?? null,
            'status' => $extra['status'] ?? 'completed',
        ]));
    }

    protected function isRequestable(Settlement $settlement): bool
    {
        if ($settlement->status->value !== SettlementStatus::ELIGIBLE->value) {
            return false;
        }

        if (! $this->isCycleComplete($settlement)) {
            return false;
        }

        $hasOpenPayout = PayoutRequest::query()
            ->where('settlement_id', $settlement->id)
            ->whereIn('status', [
                PayoutStatus::PENDING->value,
                PayoutStatus::APPROVED->value,
                PayoutStatus::PROCESSING->value,
            ])
            ->exists();

        return ! $hasOpenPayout;
    }

    protected function isCycleComplete(Settlement $settlement): bool
    {
        $periodEnd = $settlement->period_end instanceof Carbon
            ? $settlement->period_end
            : Carbon::parse($settlement->period_end);

        return $periodEnd->copy()->endOfDay()->lte(now());
    }

    protected function assertStatus(PayoutRequest $payout, PayoutStatus $expected, string $message): void
    {
        if ($payout->status->value !== $expected->value) {
            throw new DomainException($message, 422);
        }
    }
}
