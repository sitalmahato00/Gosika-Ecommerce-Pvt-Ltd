<?php

namespace App\Modules\Vendor\Presentation\Http\Controllers;

use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Application\DataTransferObjects\BankAccountDTO;
use App\Modules\Vendor\Application\Services\VendorOnboardingService;
use App\Modules\Vendor\Infrastructure\Models\BankAccount;
use App\Modules\Vendor\Presentation\Http\Requests\BankAccountRequest;
use App\Modules\Vendor\Presentation\Resources\BankAccountResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class BankAccountController extends Controller
{
    public function __construct(protected VendorOnboardingService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:vendor');
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        return Response::success(
            BankAccountResource::collection($vendor->bankAccounts),
            'Bank accounts retrieved.'
        );
    }

    public function store(BankAccountRequest $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $account = $this->service->addBankAccount($vendor, BankAccountDTO::fromArray($request->validated()));

        return Response::success(new BankAccountResource($account), 'Bank account added.', [], 201);
    }

    public function destroy(Request $request, string $accountId): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $account = $vendor->bankAccounts()->where('uuid', $accountId)->first();

        if (! $account) {
            throw new DomainException('Bank account not found.', 404);
        }

        $account->delete();

        return Response::noContent('Bank account removed.');
    }

    protected function vendorFor(Request $request)
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must apply for a vendor account first.', 422);
        }

        return $vendor;
    }
}
