<?php

namespace App\Modules\Wallet\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Domain\Enums\PayoutStatus;
use App\Modules\Shared\Domain\Enums\SettlementStatus;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Presentation\Resources\BankAccountResource;
use App\Modules\Wallet\Application\Services\WalletService;
use App\Modules\Wallet\Infrastructure\Models\PayoutRequest;
use App\Modules\Wallet\Infrastructure\Models\Settlement;
use App\Modules\Wallet\Infrastructure\Models\VendorWallet;
use App\Modules\Wallet\Infrastructure\Models\WalletTransaction;
use App\Modules\Wallet\Presentation\Http\Requests\AdjustBalanceRequest;
use App\Modules\Wallet\Presentation\Http\Requests\GenerateSettlementRequest;
use App\Modules\Wallet\Presentation\Http\Requests\MarkPayoutPaidRequest;
use App\Modules\Wallet\Presentation\Http\Requests\RejectPayoutRequest;
use App\Modules\Wallet\Presentation\Resources\CommissionResource;
use App\Modules\Wallet\Presentation\Resources\PayoutRequestResource;
use App\Modules\Wallet\Presentation\Resources\SettlementResource;
use App\Modules\Wallet\Presentation\Resources\WalletResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminWalletController extends Controller
{
    public function __construct(protected WalletService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::WALLETS_VIEW);
        $this->middleware('permission:'.Permissions::PAYOUTS_APPROVE)->only([
            'approvePayout',
            'rejectPayout',
            'markPayoutPaid',
            'cancelPayout',
        ]);
        $this->middleware('permission:'.Permissions::SETTLEMENTS_MANAGE)->only([
            'generateSettlement',
            'updateSettlementCycle',
            'holdSettlement',
            'releaseSettlement',
            'distributeSettlement',
        ]);
        $this->middleware('permission:'.Permissions::WALLETS_ADJUST)->only(['adjustBalance']);
    }

    public function wallet(string $vendorId): JsonResponse
    {
        $vendor = $this->vendor($vendorId);

        return Response::success(new WalletResource($this->service->walletForVendor($vendor)), 'Wallet retrieved.');
    }

    public function transactions(string $vendorId): JsonResponse
    {
        $vendor = $this->vendor($vendorId);

        return Response::success(
            \App\Modules\Wallet\Presentation\Resources\WalletTransactionResource::collection($this->service->transactionsFor($vendor)),
            'Wallet transactions retrieved.'
        );
    }

    public function commissions(string $vendorId): JsonResponse
    {
        $vendor = $this->vendor($vendorId);

        return Response::success(
            CommissionResource::collection($this->service->commissionsFor($vendor)),
            'Commissions retrieved.'
        );
    }

    public function settlements(string $vendorId): JsonResponse
    {
        $vendor = $this->vendor($vendorId);

        return Response::success(
            SettlementResource::collection($this->service->settlementsFor($vendor)),
            'Settlements retrieved.'
        );
    }

    public function wallets(Request $request): JsonResponse
    {
        $wallets = VendorWallet::query()
            ->with('vendor')
            ->when($request->input('search'), function ($q, $s) {
                $q->whereHas('vendor', fn ($v) => $v->where('company_name', 'like', "%{$s}%"));
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            WalletResource::collection($wallets),
            'Wallets retrieved.',
            ['pagination' => [
                'total' => $wallets->total(),
                'per_page' => $wallets->perPage(),
                'current_page' => $wallets->currentPage(),
                'last_page' => $wallets->lastPage(),
            ]]
        );
    }

    public function allPayouts(Request $request): JsonResponse
    {
        $payouts = PayoutRequest::query()
            ->with(['vendor', 'bankAccount', 'settlement'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('search'), function ($q, $s) {
                $q->where('payout_number', 'like', "%{$s}%")
                    ->orWhereHas('vendor', fn ($v) => $v->where('company_name', 'like', "%{$s}%"));
            })
            ->when($request->input('date_from'), fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            PayoutRequestResource::collection($payouts),
            'Payout requests retrieved.',
            ['pagination' => [
                'total' => $payouts->total(),
                'per_page' => $payouts->perPage(),
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
            ]]
        );
    }

    public function allSettlements(Request $request): JsonResponse
    {
        $query = Settlement::query()
            ->with('vendor')
            ->when($request->input('search'), function ($q, $s) {
                $q->where('settlement_number', 'like', "%{$s}%")
                    ->orWhereHas('vendor', fn ($v) => $v->where('company_name', 'like', "%{$s}%"));
            });

        if ($request->boolean('group_by_vendor')) {
            $settlements = $query->latest()->get();

            $statusPriority = [
                SettlementStatus::PROCESSING->value => 0,
                SettlementStatus::HOLD->value => 1,
                SettlementStatus::ELIGIBLE->value => 2,
                SettlementStatus::PAID->value => 3,
            ];

            $grouped = $settlements
                ->groupBy('vendor_id')
                ->map(function ($rows) use ($statusPriority) {
                    $vendor = $rows->first()->vendor;

                    $statuses = $rows->pluck('status')->map->value;
                    $bestStatus = $statuses
                        ->sortBy(fn ($s) => $statusPriority[$s] ?? 99)
                        ->first();

                    $open = $rows->reject(fn ($r) => $r->status->value === SettlementStatus::PAID->value);

                    return [
                        'vendor_id' => $vendor?->uuid,
                        'vendor_name' => $vendor?->company_name,
                        'settlement_cycle_days' => $vendor ? $this->settlementCycleDays($vendor) : 14,
                        'period_start' => $rows->min('period_start')?->toDateString(),
                        'period_end' => $rows->max('period_end')?->toDateString(),
                        'gross_sales' => number_format((float) $rows->sum(fn ($r) => (float) $r->gross_sales), 2, '.', ''),
                        'commission_total' => number_format((float) $rows->sum(fn ($r) => (float) $r->commission_total), 2, '.', ''),
                        'net_payable' => number_format((float) $open->sum(fn ($r) => (float) $r->net_payable), 2, '.', ''),
                        'settled_amount' => number_format((float) $rows->filter(fn ($r) => $r->status->value === SettlementStatus::PAID->value)->sum(fn ($r) => (float) $r->net_payable), 2, '.', ''),
                        'status' => $bestStatus,
                        'settlements_count' => $rows->count(),
                        'open_count' => $open->count(),
                    ];
                })
                ->sortBy(fn ($v) => $statusPriority[$v['status']] ?? 99)
                ->values();

            return Response::success($grouped, 'Vendor settlement summaries retrieved.');
        }

        $settlements = $query
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            SettlementResource::collection($settlements),
            'Settlements retrieved.',
            ['pagination' => [
                'total' => $settlements->total(),
                'per_page' => $settlements->perPage(),
                'current_page' => $settlements->currentPage(),
                'last_page' => $settlements->lastPage(),
            ]]
        );
    }

    public function ledger(Request $request, string $vendorId): JsonResponse
    {
        $vendor = $this->vendor($vendorId);

        $wallet = $this->service->walletForVendor($vendor);

        $settlementModels = $this->service->settlementsFor($vendor);

        $settlementOrderMap = collect();
        foreach ($settlementModels as $settlement) {
            foreach ($settlement->meta['vendor_order_ids'] ?? [] as $orderId) {
                $settlementOrderMap->put((int) $orderId, [
                    'number' => $settlement->settlement_number,
                    'status' => $settlement->status->value,
                    'period_start' => $settlement->period_start?->toDateString(),
                    'period_end' => $settlement->period_end?->toDateString(),
                    'hold_reason' => $settlement->hold_reason,
                    'paid' => $settlement->status->value === SettlementStatus::PAID->value,
                ]);
            }
        }

        $statsQuery = VendorOrder::query()->where('vendor_id', $vendor->id);
        $stats = [
            'orders_count' => (clone $statsQuery)->count(),
            'total_gross' => number_format((float) (clone $statsQuery)->sum('grand_total'), 2, '.', ''),
            'total_commission' => number_format((float) (clone $statsQuery)->sum('commission_amount'), 2, '.', ''),
            'total_vendor_payable' => number_format((float) (clone $statsQuery)->sum('vendor_payable'), 2, '.', ''),
            'total_settled' => number_format($settlementModels->where('status', SettlementStatus::PAID)->sum(fn ($s) => (float) $s->net_payable), 2, '.', ''),
            'total_withdrawn' => number_format(PayoutRequest::query()->where('vendor_id', $vendor->id)->where('status', PayoutStatus::PAID->value)->sum('amount'), 2, '.', ''),
        ];

        $orderSearch = trim((string) $request->input('order_search', ''));
        $ordersPaginator = VendorOrder::query()
            ->where('vendor_id', $vendor->id)
            ->with(['order', 'items', 'store'])
            ->when($orderSearch !== '', function ($q, $s) {
                $q->where(function ($q2) use ($s) {
                    $q2->where('vendor_order_number', 'like', "%{$s}%")
                        ->orWhereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$s}%"))
                        ->orWhereHas('items', fn ($i) => $i->where('product_name', 'like', "%{$s}%"));
                });
            })
            ->latest('id')
            ->paginate($request->integer('orders_per_page', 15), ['*'], 'orders_page');

        $orders = $ordersPaginator->getCollection()->map(function (VendorOrder $vo) use ($settlementOrderMap) {
            $itemsSubtotal = (float) $vo->items_subtotal;
            $commissionAmount = (float) $vo->commission_amount;
            $commissionRate = (float) $vo->commission_rate;

            return [
                'id' => $vo->uuid,
                'vendor_order_number' => $vo->vendor_order_number,
                'order_number' => $vo->order?->order_number,
                'placed_at' => $vo->order?->placed_at?->toISOString(),
                'status' => $vo->status->value,
                'delivery_status' => $vo->delivery_status?->value,
                'store_name' => $vo->store?->name,
                'items_subtotal' => number_format($itemsSubtotal, 2, '.', ''),
                'discount' => number_format((float) $vo->discount, 2, '.', ''),
                'delivery_charge' => number_format((float) $vo->delivery_charge, 2, '.', ''),
                'tax' => number_format((float) $vo->tax, 2, '.', ''),
                'grand_total' => number_format((float) $vo->grand_total, 2, '.', ''),
                'commission_rate' => number_format($commissionRate, 2, '.', ''),
                'commission_amount' => number_format($commissionAmount, 2, '.', ''),
                'vendor_payable' => number_format((float) $vo->vendor_payable, 2, '.', ''),
                'settlement' => $settlementOrderMap->get($vo->id),
                'items' => $vo->items->map(function ($item) use ($itemsSubtotal, $commissionAmount) {
                    $lineTotal = (float) $item->line_total;
                    $lineCommission = $itemsSubtotal > 0 ? round($commissionAmount * ($lineTotal / $itemsSubtotal), 2) : 0.0;

                    return [
                        'product_name' => $item->product_name,
                        'sku' => $item->sku,
                        'variant_name' => $item->variant_name,
                        'quantity' => $item->quantity,
                        'unit_price' => number_format((float) $item->unit_price, 2, '.', ''),
                        'unit_discount' => number_format((float) ($item->unit_discount ?? 0), 2, '.', ''),
                        'line_total' => number_format($lineTotal, 2, '.', ''),
                        'line_commission' => number_format($lineCommission, 2, '.', ''),
                        'line_vendor_payable' => number_format($lineTotal - $lineCommission, 2, '.', ''),
                    ];
                }),
            ];
        })->values();

        $txnSearch = trim((string) $request->input('txn_search', ''));
        $txnPaginator = WalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->when($txnSearch !== '', function ($q, $s) {
                $q->where(function ($q2) use ($s) {
                    $q2->where('description', 'like', "%{$s}%")
                        ->orWhere('transaction_type', 'like', "%{$s}%")
                        ->orWhere('reference_id', ctype_digit($s) ? (int) $s : 0);
                });
            })
            ->orderByDesc('id')
            ->paginate($request->integer('txn_per_page', 15), ['*'], 'txn_page');

        $transactions = $txnPaginator->getCollection()
            ->map(fn ($t) => (new \App\Modules\Wallet\Presentation\Resources\WalletTransactionResource($t))->resolve($request))
            ->values();

        $settlementsPaginator = Settlement::query()
            ->where('vendor_id', $vendor->id)
            ->with(['payoutRequests'])
            ->latest('id')
            ->paginate($request->integer('settlements_per_page', 15), ['*'], 'settlements_page');

        $settlements = $settlementsPaginator->getCollection()
            ->map(fn ($s) => (new SettlementResource($s))->resolve($request))
            ->values();

        $payoutsPaginator = PayoutRequest::query()
            ->where('vendor_id', $vendor->id)
            ->with(['bankAccount', 'records', 'settlement'])
            ->latest('id')
            ->paginate($request->integer('payouts_per_page', 15), ['*'], 'payouts_page');

        $payouts = $payoutsPaginator->getCollection()
            ->map(fn ($p) => (new PayoutRequestResource($p))->resolve($request))
            ->values();

        $bankAccounts = BankAccount::query()
            ->where('vendor_id', $vendor->id)
            ->orderByDesc('is_default')
            ->orderByDesc('is_verified')
            ->latest('id')
            ->get();

        return Response::success([
            'vendor' => [
                'id' => $vendor->uuid,
                'company_name' => $vendor->company_name,
                'business_email' => $vendor->business_email,
                'pan_vat' => $vendor->pan_vat,
                'status' => $vendor->status->value,
                'settlement_cycle_days' => $this->settlementCycleDays($vendor),
            ],
            'wallet' => new WalletResource($wallet),
            'stats' => $stats,
            'orders' => $orders,
            'orders_pagination' => $this->paginationMeta($ordersPaginator),
            'transactions' => $transactions,
            'transactions_pagination' => $this->paginationMeta($txnPaginator),
            'settlements' => $settlements,
            'settlements_pagination' => $this->paginationMeta($settlementsPaginator),
            'payouts' => $payouts,
            'payouts_pagination' => $this->paginationMeta($payoutsPaginator),
            'bank_accounts' => BankAccountResource::collection($bankAccounts),
        ], 'Vendor finance ledger retrieved.');
    }

    protected function paginationMeta($paginator): array
    {
        return [
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
        ];
    }

    public function generateSettlement(GenerateSettlementRequest $request): JsonResponse
    {
        $vendor = $this->vendor($request->input('vendor_id'));

        $settlement = $this->service->settleVendor(
            $vendor,
            \Illuminate\Support\Carbon::parse($request->input('period_start')),
            \Illuminate\Support\Carbon::parse($request->input('period_end'))->endOfDay()
        );

        app(AuditLogService::class)->record(request()->user(), 'settlement.generated', 'settlement', $settlement->uuid, null, ['vendor' => $vendor->uuid]);

        return Response::created(new SettlementResource($settlement), 'Settlement generated.');
    }

    public function updateSettlementCycle(Request $request, string $vendorId): JsonResponse
    {
        $vendor = $this->vendor($vendorId);

        $validated = $request->validate([
            'settlement_cycle_days' => ['required', 'integer', 'min:1', 'max:120'],
        ]);

        $days = (int) $validated['settlement_cycle_days'];
        $meta = is_array($vendor->meta) ? $vendor->meta : [];
        $meta['settlement_cycle_days'] = $days;
        $vendor->update(['meta' => $meta]);

        app(AuditLogService::class)->record(request()->user(), 'settlement.cycle_updated', 'vendor', $vendor->uuid, null, ['settlement_cycle_days' => $days]);

        return Response::success([
            'vendor_id' => $vendor->uuid,
            'settlement_cycle_days' => $days,
        ], 'Settlement cycle updated.');
    }

    protected function settlementCycleDays(Vendor $vendor): int
    {
        return (int) ($vendor->meta['settlement_cycle_days'] ?? 14);
    }

    public function payouts(string $vendorId): JsonResponse
    {
        $vendor = $this->vendor($vendorId);

        return Response::success(
            PayoutRequestResource::collection($this->service->payoutsFor($vendor)),
            'Payout requests retrieved.'
        );
    }

    public function approvePayout(string $payoutId): JsonResponse
    {
        $payout = $this->payout($payoutId);
        $payout = $this->service->approvePayout($payout, request()->user());

        app(AuditLogService::class)->record(request()->user(), 'payout.approved', 'payout', $payout->uuid, ['status' => 'requested'], ['status' => $payout->status->value]);

        return Response::success(new PayoutRequestResource($payout), 'Payout approved.');
    }

    public function rejectPayout(RejectPayoutRequest $request, string $payoutId): JsonResponse
    {
        $payout = $this->payout($payoutId);
        $payout = $this->service->rejectPayout($payout, request()->user(), $request->input('reason'));

        app(AuditLogService::class)->record(request()->user(), 'payout.rejected', 'payout', $payout->uuid, ['status' => 'requested'], ['status' => 'rejected', 'reason' => $request->input('reason')]);

        return Response::success(new PayoutRequestResource($payout), 'Payout rejected.');
    }

    public function markPayoutPaid(MarkPayoutPaidRequest $request, string $payoutId): JsonResponse
    {
        $payout = $this->payout($payoutId);
        $payout = $this->service->markPayoutPaid(
            $payout,
            request()->user(),
            $request->input('provider_reference'),
            (float) $request->input('fee', 0)
        );

        app(AuditLogService::class)->record(request()->user(), 'payout.marked_paid', 'payout', $payout->uuid, ['status' => 'approved'], ['status' => 'paid', 'provider_reference' => $request->input('provider_reference')]);

        return Response::success(new PayoutRequestResource($payout), 'Payout marked as paid.');
    }

    public function cancelPayout(string $payoutId): JsonResponse
    {
        $payout = $this->payout($payoutId);
        $payout = $this->service->cancelPayout($payout, request()->user());

        app(AuditLogService::class)->record(request()->user(), 'payout.cancelled', 'payout', $payout->uuid, null, ['status' => 'cancelled']);

        return Response::success(new PayoutRequestResource($payout), 'Payout cancelled.');
    }

    public function adjustBalance(AdjustBalanceRequest $request, string $vendorId): JsonResponse
    {
        $vendor = $this->vendor($vendorId);

        $wallet = $this->service->adjustBalance(
            $vendor,
            (float) $request->input('amount'),
            $request->input('reason'),
            request()->user()
        );

        app(AuditLogService::class)->record(request()->user(), 'wallet.adjusted', 'wallet', $wallet->uuid, null, ['vendor' => $vendor->uuid, 'amount' => $request->input('amount'), 'reason' => $request->input('reason')]);

        return Response::success(new WalletResource($wallet), 'Balance adjusted.');
    }

    public function holdSettlement(Request $request, string $settlementId): JsonResponse
    {
        $settlement = $this->settlement($settlementId);
        $settlement = $this->service->holdSettlement($settlement, request()->user(), $request->input('reason', 'Held by administrator'));

        app(AuditLogService::class)->record(request()->user(), 'settlement.held', 'settlement', $settlement->uuid, ['status' => 'eligible'], ['status' => 'hold', 'reason' => $settlement->hold_reason]);

        return Response::success(new SettlementResource($settlement->load('vendor')), 'Settlement placed on hold.');
    }

    public function releaseSettlement(string $settlementId): JsonResponse
    {
        $settlement = $this->settlement($settlementId);
        $settlement = $this->service->releaseSettlement($settlement, request()->user());

        app(AuditLogService::class)->record(request()->user(), 'settlement.released', 'settlement', $settlement->uuid, ['status' => 'hold'], ['status' => $settlement->status->value]);

        return Response::success(new SettlementResource($settlement->load('vendor')), 'Settlement released from hold.');
    }

    public function distributeSettlement(string $settlementId): JsonResponse
    {
        $settlement = $this->settlement($settlementId);
        $settlement = $this->service->distributeSettlement($settlement, request()->user());

        app(AuditLogService::class)->record(request()->user(), 'settlement.distributed', 'settlement', $settlement->uuid, ['status' => $settlement->status->value], ['status' => SettlementStatus::PAID->value]);

        return Response::success(new SettlementResource($settlement->load('vendor')), 'Settlement distributed.');
    }

    protected function vendor(string $vendorId): Vendor
    {
        $vendor = Vendor::query()
            ->where('uuid', $vendorId)
            ->orWhere('id', ctype_digit($vendorId) ? (int) $vendorId : 0)
            ->first();

        if (! $vendor) {
            throw new DomainException('Vendor not found.', 404);
        }

        return $vendor;
    }

    protected function payout(string $payoutId): PayoutRequest
    {
        $payout = PayoutRequest::query()
            ->with(['bankAccount', 'settlement', 'records'])
            ->where('uuid', $payoutId)
            ->orWhere('id', ctype_digit($payoutId) ? (int) $payoutId : 0)
            ->first();

        if (! $payout) {
            throw new DomainException('Payout request not found.', 404);
        }

        return $payout;
    }

    protected function settlement(string $settlementId): Settlement
    {
        return Settlement::query()
            ->where('uuid', $settlementId)
            ->orWhere('id', ctype_digit($settlementId) ? (int) $settlementId : 0)
            ->firstOrFail();
    }
}
