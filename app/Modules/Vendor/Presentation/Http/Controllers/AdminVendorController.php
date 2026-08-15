<?php

namespace App\Modules\Vendor\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Application\Services\VendorOnboardingService;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
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
        $this->middleware('role:'.Roles::SUPER_ADMIN);
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

    public function approveStore(string $storeId): JsonResponse
    {
        $store = Store::where('uuid', $storeId)->firstOrFail();
        $store = $this->service->approveStore(request()->user(), $store);

        return Response::success(new StoreResource($store), 'Store approved.');
    }

    public function rejectStore(VendorReviewRequest $request, string $storeId): JsonResponse
    {
        $store = Store::where('uuid', $storeId)->firstOrFail();

        if (! $request->input('reason')) {
            throw new DomainException('A rejection reason is required.');
        }

        $store = $this->service->rejectStore($request->user(), $store, $request->input('reason'));

        return Response::success(new StoreResource($store), 'Store rejected.');
    }
}
