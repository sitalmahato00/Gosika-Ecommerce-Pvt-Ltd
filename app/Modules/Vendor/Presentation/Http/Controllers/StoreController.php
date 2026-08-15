<?php

namespace App\Modules\Vendor\Presentation\Http\Controllers;

use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Application\DataTransferObjects\StoreDTO;
use App\Modules\Vendor\Application\Services\VendorOnboardingService;
use App\Modules\Vendor\Presentation\Http\Requests\StoreRequest;
use App\Modules\Vendor\Presentation\Resources\StoreResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class StoreController extends Controller
{
    public function __construct(protected VendorOnboardingService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:vendor');
    }

    public function create(StoreRequest $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $store = $this->service->createStore($vendor, StoreDTO::fromArray($request->validated()));

        return Response::success(new StoreResource($store), 'Store created.', [], 201);
    }

    public function update(StoreRequest $request, string $storeId): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $store = $this->findOwnedStore($vendor, $storeId);

        $store = $this->service->updateStore($vendor, $store, StoreDTO::fromArray($request->validated()));

        return Response::success(new StoreResource($store), 'Store updated.');
    }

    public function submit(Request $request, string $storeId): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $store = $this->findOwnedStore($vendor, $storeId);
        $store = $this->service->submitStoreForApproval($vendor, $store);

        return Response::success(new StoreResource($store), 'Store submitted for approval.');
    }

    public function myStores(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        return Response::success(
            StoreResource::collection($vendor->stores),
            'Stores retrieved.'
        );
    }

    protected function vendorFor(Request $request)
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must apply for a vendor account first.', 422);
        }

        return $vendor;
    }

    protected function findOwnedStore($vendor, string $storeId)
    {
        $store = $vendor->stores()->where('uuid', $storeId)->first();

        if (! $store) {
            throw new DomainException('Store not found.', 404);
        }

        return $store;
    }
}
