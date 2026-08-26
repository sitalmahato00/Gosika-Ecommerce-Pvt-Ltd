<?php

namespace App\Modules\Wallet\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Application\Services\WalletService;
use App\Modules\Wallet\Infrastructure\Models\PayoutRequest;
use App\Modules\Wallet\Infrastructure\Models\Settlement;
use App\Modules\Wallet\Infrastructure\Models\VendorWallet;
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
        $this->middleware('permission:'.Permissions::SETTLEMENTS_MANAGE)->only(['generateSettlement']);
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
        $settlements = Settlement::query()
            ->with('vendor')
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('search'), function ($q, $s) {
                $q->where('settlement_number', 'like', "%{$s}%")
                    ->orWhereHas('vendor', fn ($v) => $v->where('company_name', 'like', "%{$s}%"));
            })
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

    public function approveSettlement(string $settlementId): JsonResponse
    {
        $settlement = Settlement::where('uuid', $settlementId)->orWhere('id', $settlementId)->firstOrFail();
        $settlement->update([
            'status' => 'approved',
            'paid_at' => now(),
        ]);

        app(AuditLogService::class)->record(request()->user(), 'settlement.approved', 'settlement', $settlement->uuid, null, ['status' => 'approved']);

        return Response::success(new SettlementResource($settlement), 'Settlement approved.');
    }

    public function rejectSettlement(Request $request, string $settlementId): JsonResponse
    {
        $settlement = Settlement::where('uuid', $settlementId)->orWhere('id', $settlementId)->firstOrFail();
        $settlement->update([
            'status' => 'rejected',
        ]);

        app(AuditLogService::class)->record(request()->user(), 'settlement.rejected', 'settlement', $settlement->uuid, null, ['status' => 'rejected', 'reason' => $request->input('reason')]);

        return Response::success(new SettlementResource($settlement), 'Settlement rejected.');
    }

    protected function vendor(string $vendorId): Vendor
    {
        $vendor = Vendor::query()->where('uuid', $vendorId)->orWhere('id', $vendorId)->first();

        if (! $vendor) {
            throw new DomainException('Vendor not found.', 404);
        }

        return $vendor;
    }

    protected function payout(string $payoutId): PayoutRequest
    {
        $payout = PayoutRequest::query()->with(['bankAccount', 'settlement', 'records'])->where('uuid', $payoutId)->orWhere('id', $payoutId)->first();

        if (! $payout) {
            throw new DomainException('Payout request not found.', 404);
        }

        return $payout;
    }
}
