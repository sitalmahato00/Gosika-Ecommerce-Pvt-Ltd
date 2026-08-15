<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Order\Presentation\Resources\VendorOrderResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Shipping\Application\Services\DeliveryService;
use App\Modules\Shipping\Presentation\Http\Requests\VendorOrderDecisionRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class VendorOrderController extends Controller
{
    public function __construct(protected DeliveryService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('permission:'.Permissions::ORDERS_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request->user());

        $vendorOrders = VendorOrder::query()
            ->where('vendor_id', $vendor->id)
            ->with(['items', 'store'])
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->input('delivery_status'), fn ($query, $status) => $query->where('delivery_status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorOrderResource::collection($vendorOrders),
            'Vendor orders retrieved.',
            ['pagination' => [
                'total' => $vendorOrders->total(),
                'per_page' => $vendorOrders->perPage(),
                'current_page' => $vendorOrders->currentPage(),
                'last_page' => $vendorOrders->lastPage(),
            ]]
        );
    }

    public function show(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->assertVendorOwns($request->user(), $vendorOrder);

        return Response::success(
            new VendorOrderResource($vendorOrder->load(['items', 'store', 'order.user', 'assignments'])),
            'Vendor order retrieved.'
        );
    }

    public function accept(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->assertVendorOwns($request->user(), $vendorOrder);

        try {
            $vendorOrder = $this->service->vendorAccept($vendorOrder, $request->user());

            return Response::success(new VendorOrderResource($vendorOrder->load('items')), 'Vendor order accepted.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function reject(VendorOrderDecisionRequest $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->assertVendorOwns($request->user(), $vendorOrder);

        try {
            $vendorOrder = $this->service->vendorReject($vendorOrder, $request->user(), $request->input('reason') ?? '');

            return Response::success(new VendorOrderResource($vendorOrder->load('items')), 'Vendor order rejected.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function readyForPickup(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        $this->assertVendorOwns($request->user(), $vendorOrder);

        try {
            $vendorOrder = $this->service->markReadyForPickup($vendorOrder, $request->user());

            return Response::success(new VendorOrderResource($vendorOrder->load('items')), 'Vendor order marked ready for pickup.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    protected function vendorFor($user)
    {
        $vendor = $user->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access vendor orders.', 403);
        }

        return $vendor;
    }

    protected function assertVendorOwns($user, VendorOrder $vendorOrder): void
    {
        $vendor = $this->vendorFor($user);

        if ($vendorOrder->vendor_id !== $vendor->id) {
            throw new DomainException('You do not have access to this vendor order.', 403);
        }
    }
}
