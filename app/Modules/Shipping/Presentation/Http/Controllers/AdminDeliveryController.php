<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Shipping\Application\Services\DeliveryService;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Shipping\Presentation\Http\Requests\AssignDeliveryRequest;
use App\Modules\Shipping\Presentation\Http\Requests\ReassignDeliveryRequest;
use App\Modules\Shipping\Presentation\Resources\DeliveryAssignmentResource;
use App\Modules\Shipping\Presentation\Resources\DeliveryPartnerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminDeliveryController extends Controller
{
    public function __construct(protected DeliveryService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::DELIVERY_PARTNERS_MANAGE.'|'.Permissions::DELIVERIES_MANAGE);
        $this->middleware('permission:'.Permissions::DELIVERY_PARTNERS_MANAGE)->only(['partners', 'partner', 'approve', 'reject', 'suspend', 'activate']);
    }

    public function partners(Request $request): JsonResponse
    {
        $partners = DeliveryPartner::query()
            ->with('user')
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->input('online'), fn ($query, $online) => $query->where('is_online', (bool) $online))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            DeliveryPartnerResource::collection($partners),
            'Delivery partners retrieved.',
            ['pagination' => [
                'total' => $partners->total(),
                'per_page' => $partners->perPage(),
                'current_page' => $partners->currentPage(),
                'last_page' => $partners->lastPage(),
            ]]
        );
    }

    public function partner(string $partnerId): JsonResponse
    {
        $partner = DeliveryPartner::query()
            ->with('user')
            ->where('uuid', $partnerId)
            ->firstOrFail();

        return Response::success(new DeliveryPartnerResource($partner), 'Delivery partner retrieved.');
    }

    public function approve(string $partnerId): JsonResponse
    {
        $partner = DeliveryPartner::where('uuid', $partnerId)->firstOrFail();
        $partner = $this->service->approve(request()->user(), $partner);

        return Response::success(new DeliveryPartnerResource($partner), 'Delivery partner approved.');
    }

    public function reject(Request $request, string $partnerId): JsonResponse
    {
        $partner = DeliveryPartner::where('uuid', $partnerId)->firstOrFail();

        if (! $request->input('reason')) {
            throw new DomainException('A rejection reason is required.');
        }

        $partner = $this->service->reject(request()->user(), $partner, $request->input('reason'));

        return Response::success(new DeliveryPartnerResource($partner), 'Delivery partner rejected.');
    }

    public function suspend(Request $request, string $partnerId): JsonResponse
    {
        $partner = DeliveryPartner::where('uuid', $partnerId)->firstOrFail();
        $partner = $this->service->suspend(request()->user(), $partner, $request->input('reason'));

        return Response::success(new DeliveryPartnerResource($partner), 'Delivery partner suspended.');
    }

    public function activate(string $partnerId): JsonResponse
    {
        $partner = DeliveryPartner::where('uuid', $partnerId)->firstOrFail();
        $partner = $this->service->activate(request()->user(), $partner);

        return Response::success(new DeliveryPartnerResource($partner), 'Delivery partner activated.');
    }

    public function assignments(Request $request): JsonResponse
    {
        $assignments = DeliveryAssignment::query()
            ->with(['tracking', 'vendorOrder', 'deliveryPartner'])
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->input('partner_id'), fn ($query, $id) => $query->whereHas('deliveryPartner', fn ($q) => $q->where('uuid', $id)))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            DeliveryAssignmentResource::collection($assignments),
            'Deliveries retrieved.',
            ['pagination' => [
                'total' => $assignments->total(),
                'per_page' => $assignments->perPage(),
                'current_page' => $assignments->currentPage(),
                'last_page' => $assignments->lastPage(),
            ]]
        );
    }

    public function assignment(string $assignmentId): JsonResponse
    {
        $assignment = DeliveryAssignment::query()
            ->with(['tracking', 'vendorOrder', 'deliveryPartner'])
            ->where('uuid', $assignmentId)
            ->firstOrFail();

        return Response::success(new DeliveryAssignmentResource($assignment), 'Delivery retrieved.');
    }

    public function assign(AssignDeliveryRequest $request): JsonResponse
    {
        $vendorOrder = VendorOrder::where('uuid', $request->input('vendor_order_id'))->firstOrFail();
        $partner = DeliveryPartner::where('uuid', $request->input('delivery_partner_id'))->firstOrFail();

        try {
            $assignment = $this->service->assign(
                $request->user(),
                $vendorOrder,
                $partner,
                $request->filled('delivery_fee') ? (float) $request->input('delivery_fee') : null,
                $request->filled('cod_amount') ? (float) $request->input('cod_amount') : null,
            );

            return Response::created(
                new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder', 'deliveryPartner'])),
                'Delivery partner assigned.'
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function reassign(ReassignDeliveryRequest $request, DeliveryAssignment $assignment): JsonResponse
    {
        $partner = DeliveryPartner::where('uuid', $request->input('delivery_partner_id'))->firstOrFail();

        try {
            $assignment = $this->service->reassign($request->user(), $assignment, $partner);

            return Response::success(
                new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder', 'deliveryPartner'])),
                'Delivery reassigned.'
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }
}
