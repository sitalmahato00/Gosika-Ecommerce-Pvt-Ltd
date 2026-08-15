<?php

namespace App\Modules\Wallet\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Application\Services\WalletService;
use App\Modules\Wallet\Presentation\Http\Requests\RequestPayoutRequest;
use App\Modules\Wallet\Presentation\Resources\PayoutRequestResource;
use App\Modules\Wallet\Presentation\Resources\WalletResource;
use App\Modules\Wallet\Presentation\Resources\WalletTransactionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class VendorWalletController extends Controller
{
    public function __construct(protected WalletService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function summary(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        return Response::success(new WalletResource($this->service->walletForVendor($vendor)), 'Wallet retrieved.');
    }

    public function transactions(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        return Response::success(
            WalletTransactionResource::collection($this->service->transactionsFor($vendor)),
            'Wallet transactions retrieved.'
        );
    }

    public function payouts(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        return Response::success(
            PayoutRequestResource::collection($this->service->payoutsFor($vendor)),
            'Payout requests retrieved.'
        );
    }

    public function requestPayout(RequestPayoutRequest $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $bankAccount = $request->input('bank_account_id')
            ? $this->bankAccountId($vendor, $request->input('bank_account_id'))
            : null;

        $payout = $this->service->requestPayout(
            $vendor,
            (float) $request->input('amount'),
            $bankAccount,
            $request->user()
        );

        return Response::created(new PayoutRequestResource($payout), 'Payout requested.');
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access the wallet.', 403);
        }

        return $vendor;
    }

    protected function bankAccountId(Vendor $vendor, string $uuid): ?int
    {
        $account = $vendor->bankAccounts()->where('uuid', $uuid)->first();

        if (! $account) {
            throw new DomainException('Selected bank account does not belong to this vendor.', 422);
        }

        return $account->id;
    }
}
