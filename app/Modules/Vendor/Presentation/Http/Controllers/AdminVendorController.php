<?php

namespace App\Modules\Vendor\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Enums\KycStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Application\Services\VendorOnboardingService;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Infrastructure\Models\VendorKyc;
use App\Modules\Vendor\Presentation\Http\Requests\VendorReviewRequest;
use App\Modules\Vendor\Presentation\Resources\StoreResource;
use App\Modules\Vendor\Presentation\Resources\VendorResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminVendorController extends Controller
{
    public function __construct(protected VendorOnboardingService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
        $this->middleware('permission:'.Permissions::VENDORS_APPROVE.'|'.Permissions::VENDORS_VIEW);
    }

    public function index(Request $request): JsonResponse
    {
        $vendors = Vendor::query()
            ->with(['kyc', 'stores'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorResource::collection($vendors),
            'Vendors retrieved.',
            ['pagination' => [
                'total' => $vendors->total(),
                'per_page' => $vendors->perPage(),
                'current_page' => $vendors->currentPage(),
                'last_page' => $vendors->lastPage(),
            ]]
        );
    }

    public function show(string $vendorId): JsonResponse
    {
        $vendor = Vendor::query()
            ->with(['kyc', 'documents', 'stores', 'bankAccounts'])
            ->where('uuid', $vendorId)
            ->firstOrFail();

        return Response::success(new VendorResource($vendor), 'Vendor retrieved.');
    }

    public function approve(VendorReviewRequest $request, string $vendorId): JsonResponse
    {
        $vendor = Vendor::where('uuid', $vendorId)->firstOrFail();
        $vendor = $this->service->approveVendor($request->user(), $vendor);

        return Response::success(new VendorResource($vendor), 'Vendor approved.');
    }

    public function reject(VendorReviewRequest $request, string $vendorId): JsonResponse
    {
        $vendor = Vendor::where('uuid', $vendorId)->firstOrFail();

        if (! $request->input('reason')) {
            throw new DomainException('A rejection reason is required.');
        }

        $vendor = $this->service->rejectVendor($request->user(), $vendor, $request->input('reason'));

        return Response::success(new VendorResource($vendor), 'Vendor rejected.');
    }

    public function suspend(Request $request, string $vendorId): JsonResponse
    {
        $vendor = Vendor::where('uuid', $vendorId)
            ->when(ctype_digit($vendorId), fn ($q) => $q->orWhere('id', (int) $vendorId))
            ->firstOrFail();
        $vendor->update([
            'status' => \App\Modules\Shared\Domain\Enums\VendorStatus::SUSPENDED,
            'rejection_reason' => $request->input('reason', 'Suspended by admin'),
        ]);

        return Response::success(new VendorResource($vendor), 'Vendor suspended.');
    }

    public function activate(Request $request, string $vendorId): JsonResponse
    {
        $vendor = Vendor::where('uuid', $vendorId)
            ->when(ctype_digit($vendorId), fn ($q) => $q->orWhere('id', (int) $vendorId))
            ->firstOrFail();
        $vendor->update([
            'status' => \App\Modules\Shared\Domain\Enums\VendorStatus::APPROVED,
            'rejection_reason' => null,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return Response::success(new VendorResource($vendor), 'Vendor activated.');
    }

    public function stores(Request $request): JsonResponse
    {
        $stores = Store::query()
            ->with(['vendor'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->search.'%';
                $q->where('name', 'like', $term)->orWhere('slug', 'like', $term);
            })
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return Response::success(
            StoreResource::collection($stores),
            'Stores retrieved.',
            ['pagination' => [
                'total' => $stores->total(),
                'per_page' => $stores->perPage(),
                'current_page' => $stores->currentPage(),
                'last_page' => $stores->lastPage(),
            ]]
        );
    }

    public function kycList(Request $request): JsonResponse
    {
        $kycs = \App\Modules\Vendor\Infrastructure\Models\VendorKyc::query()
            ->with(['vendor', 'documents'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return Response::success(
            $kycs->items(),
            'KYC submissions retrieved.',
            ['pagination' => [
                'total' => $kycs->total(),
                'per_page' => $kycs->perPage(),
                'current_page' => $kycs->currentPage(),
                'last_page' => $kycs->lastPage(),
            ]]
        );
    }

    public function kycShow(string $kycId): JsonResponse
    {
        $kyc = \App\Modules\Vendor\Infrastructure\Models\VendorKyc::query()
            ->with(['vendor', 'documents'])
            ->where('uuid', $kycId)
            ->when(ctype_digit($kycId), fn ($q) => $q->orWhere('id', (int) $kycId))
            ->firstOrFail();

        return Response::success($kyc, 'KYC detail retrieved.');
    }

    public function approveKyc(Request $request, string $kycId): JsonResponse
    {
        $kyc = \App\Modules\Vendor\Infrastructure\Models\VendorKyc::where('uuid', $kycId)
            ->when(ctype_digit($kycId), fn ($q) => $q->orWhere('id', (int) $kycId))
            ->firstOrFail();
        $kyc->update([
            'status' => KycStatus::APPROVED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_notes' => $request->input('notes', 'KYC approved by admin'),
        ]);

        if ($kyc->vendor) {
            $kyc->vendor->update([
                'status' => \App\Modules\Shared\Domain\Enums\VendorStatus::APPROVED,
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);
        }

        return Response::success($kyc, 'KYC approved.');
    }

    public function rejectKyc(Request $request, string $kycId): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:1000']);

        $kyc = \App\Modules\Vendor\Infrastructure\Models\VendorKyc::where('uuid', $kycId)
            ->when(ctype_digit($kycId), fn ($q) => $q->orWhere('id', (int) $kycId))
            ->firstOrFail();
        $kyc->update([
            'status' => KycStatus::REJECTED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_notes' => $request->input('reason'),
        ]);

        return Response::success($kyc, 'KYC rejected.');
    }

    public function requestChangesKyc(Request $request, string $kycId): JsonResponse
    {
        $request->validate(['notes' => 'required|string|max:1000']);

        $kyc = \App\Modules\Vendor\Infrastructure\Models\VendorKyc::where('uuid', $kycId)
            ->when(ctype_digit($kycId), fn ($q) => $q->orWhere('id', (int) $kycId))
            ->firstOrFail();
        $kyc->update([
            'status' => KycStatus::RESUBMISSION_REQUIRED,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_notes' => $request->input('notes'),
        ]);

        return Response::success($kyc, 'Changes requested for KYC.');
    }

    public function approveStore(string $storeId): JsonResponse
    {
        $store = Store::where('uuid', $storeId)
            ->when(ctype_digit($storeId), fn ($q) => $q->orWhere('id', (int) $storeId))
            ->firstOrFail();
        $store = $this->service->approveStore(request()->user(), $store);

        return Response::success(new StoreResource($store), 'Store approved.');
    }

    public function rejectStore(VendorReviewRequest $request, string $storeId): JsonResponse
    {
        $store = Store::where('uuid', $storeId)
            ->when(ctype_digit($storeId), fn ($q) => $q->orWhere('id', (int) $storeId))
            ->firstOrFail();

        if (! $request->input('reason')) {
            throw new DomainException('A rejection reason is required.');
        }

        $store = $this->service->rejectStore($request->user(), $store, $request->input('reason'));

        return Response::success(new StoreResource($store), 'Store rejected.');
    }
}
