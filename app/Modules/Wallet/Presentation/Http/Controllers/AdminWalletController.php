<?php

namespace App\Modules\Wallet\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Application\Services\WalletService;
use App\Modules\Wallet\Infrastructure\Models\PayoutRequest;
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
        $this->middleware('permission:'.Permissions::WALLETS_VIEW);
        $this->middleware('permission:'.Permissions::PAYOUTS_APPROVE)->only([
            'approvePayout',
            'rejectPayout',
            'markPayoutPaid',
            'cancelPayout',
        ]);
        $this->middleware('permission:'.Permissions::SETTLEMENTS_MANAGE)->only(['generateSettlement']);
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

    public function generateSettlement(GenerateSettlementRequest $request): JsonResponse
    {
        $vendor = $this->vendor($request->input('vendor_id'));

        $settlement = $this->service->settleVendor(
            $vendor,
            \Illuminate\Support\Carbon::parse($request->input('period_start')),
            \Illuminate\Support\Carbon::parse($request->input('period_end'))->endOfDay()
        );

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

        return Response::success(new PayoutRequestResource($payout), 'Payout approved.');
    }

    public function rejectPayout(RejectPayoutRequest $request, string $payoutId): JsonResponse
    {
        $payout = $this->payout($payoutId);
        $payout = $this->service->rejectPayout($payout, request()->user(), $request->input('reason'));

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

        return Response::success(new PayoutRequestResource($payout), 'Payout marked as paid.');
    }

    public function cancelPayout(string $payoutId): JsonResponse
    {
        $payout = $this->payout($payoutId);
        $payout = $this->service->cancelPayout($payout, request()->user());

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

        return Response::success(new WalletResource($wallet), 'Balance adjusted.');
    }

    protected function vendor(string $vendorId): Vendor
    {
        $vendor = Vendor::query()->where('uuid', $vendorId)->first();

        if (! $vendor) {
            throw new DomainException('Vendor not found.', 404);
        }

        return $vendor;
    }

    protected function payout(string $payoutId): PayoutRequest
    {
        $payout = PayoutRequest::query()->with(['bankAccount', 'settlement', 'records'])->where('uuid', $payoutId)->first();

        if (! $payout) {
            throw new DomainException('Payout request not found.', 404);
        }

        return $payout;
    }
}
