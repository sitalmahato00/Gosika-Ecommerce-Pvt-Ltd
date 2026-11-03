<?php

namespace App\Modules\Wallet\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Filters\ListingDateRange;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Application\Services\WalletService;
use App\Modules\Wallet\Infrastructure\Models\Settlement;
use App\Modules\Wallet\Infrastructure\Models\WalletTransaction;
use App\Modules\Wallet\Presentation\Http\Requests\RequestPayoutRequest;
use App\Modules\Wallet\Presentation\Resources\PayoutRequestResource;
use App\Modules\Wallet\Presentation\Resources\SettlementResource;
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
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', 'in:all,credit,debit,credit_earnings,credit_settlement,credit_adjustment,debit_commission,debit_refund,debit_withdrawal,debit_adjustment'],
            'status' => ['nullable', 'string', 'max:40'],
        ]);
        $wallet = $this->service->walletForVendor($vendor);

        $query = WalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->when($filters['type'] ?? null, function ($query, $type) {
                if ($type === 'credit' || $type === 'debit') {
                    $query->where('transaction_type', 'like', $type.'_%');
                } elseif ($type !== 'all') {
                    $query->where('transaction_type', $type);
                }
            })
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $term = '%'.$search.'%';
                $query->where(function ($inner) use ($term) {
                    $inner->where('transaction_type', 'like', $term)
                        ->orWhere('description', 'like', $term)
                        ->orWhere('reference_type', 'like', $term)
                        ->orWhere('reference_id', 'like', $term);
                });
            })
            ->orderByDesc('id');

        ListingDateRange::apply($query, $request, 'created_at');
        $transactions = $query->paginate(min(max($request->integer('per_page', 20), 1), 100))->withQueryString();

        return Response::success(
            WalletTransactionResource::collection($transactions),
            'Wallet transactions retrieved.',
            ['pagination' => [
                'total' => $transactions->total(),
                'per_page' => $transactions->perPage(),
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
            ]]
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

    public function settlements(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $query = Settlement::query()
            ->where('vendor_id', $vendor->id)
            ->with(['payoutRequests'])
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('settlement_number', 'like', '%'.$search.'%');
            })
            ->orderByDesc('id');

        ListingDateRange::apply($query, $request, 'period_start');
        $settlements = $query->paginate(min(max($request->integer('per_page', 15), 1), 100))->withQueryString();

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

    public function requestPayout(RequestPayoutRequest $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $settlement = Settlement::query()
            ->where('uuid', $request->input('settlement_id'))
            ->where('vendor_id', $vendor->id)
            ->first();

        if (! $settlement) {
            throw new DomainException('Settlement not found for this vendor.', 422);
        }

        $bankAccount = $request->input('bank_account_id')
            ? $this->bankAccountId($vendor, $request->input('bank_account_id'))
            : null;

        $payout = $this->service->requestPayout(
            $settlement,
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
