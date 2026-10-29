<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Shipping\Application\DataTransferObjects\ApplyDeliveryPartnerDTO;
use App\Modules\Shipping\Application\DataTransferObjects\UpdateDeliveryPartnerProfileDTO;
use App\Modules\Shipping\Application\Services\DeliveryService;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartnerDocument;
use App\Modules\Shipping\Presentation\Http\Requests\ApplyDeliveryPartnerRequest;
use App\Modules\Shipping\Presentation\Http\Requests\DeliveryConfirmationRequest;
use App\Modules\Shipping\Presentation\Http\Requests\DeliveryFailureRequest;
use App\Modules\Shipping\Presentation\Http\Requests\UpdateDeliveryPartnerProfileRequest;
use App\Modules\Shipping\Presentation\Resources\AvailableJobResource;
use App\Modules\Shipping\Presentation\Resources\DeliveryAssignmentResource;
use App\Modules\Shipping\Presentation\Resources\DeliveryPartnerDocumentResource;
use App\Modules\Shipping\Presentation\Resources\DeliveryPartnerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DeliveryPartnerController extends Controller
{
    public function __construct(protected DeliveryService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:delivery')->except(['apply']);
    }

    public function apply(ApplyDeliveryPartnerRequest $request): JsonResponse
    {
        $partner = $this->service->apply(
            $request->user(),
            ApplyDeliveryPartnerDTO::fromArray($request->validated())
        );

        return Response::created(new DeliveryPartnerResource($partner), 'Delivery partner application submitted for approval.');
    }

    public function me(Request $request): JsonResponse
    {
        $partner = $this->partnerFor($request->user());

        return Response::success(new DeliveryPartnerResource($partner->load('documents')), 'Delivery partner profile retrieved.');
    }

    public function updateProfile(UpdateDeliveryPartnerProfileRequest $request): JsonResponse
    {
        $partner = $this->service->updateProfile(
            $request->user(),
            UpdateDeliveryPartnerProfileDTO::fromArray($request->validated())
        );

        return Response::success(new DeliveryPartnerResource($partner->load('documents')), 'Delivery partner profile updated.');
    }

    public function uploadDocument(Request $request): JsonResponse
    {
        $request->validate([
            'document_type' => ['required', 'string', 'max:40'],
            'file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf'],
        ]);

        $partner = $this->partnerFor($request->user());
        $document = $this->service->addDocument(
            $partner,
            $request->input('document_type'),
            $request->file('file')
        );

        return Response::created(
            new DeliveryPartnerDocumentResource($document),
            'Document uploaded for review.'
        );
    }

    public function deleteDocument(Request $request, DeliveryPartnerDocument $document): JsonResponse
    {
        $partner = $this->partnerFor($request->user());
        $this->service->deleteDocument($partner, $document);

        return Response::success(null, 'Document removed.');
    }

    public function setOnline(Request $request): JsonResponse
    {
        $request->validate([
            'is_online' => ['required', 'boolean'],
        ]);

        $partner = $this->service->setOnline($request->user(), (bool) $request->boolean('is_online'));

        return Response::success(new DeliveryPartnerResource($partner), 'Availability updated.');
    }

    public function assignments(Request $request): JsonResponse
    {
        $partner = $this->partnerFor($request->user());

        $assignments = $partner->assignments()
            ->with(['tracking', 'vendorOrder'])
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            DeliveryAssignmentResource::collection($assignments),
            'Assignments retrieved.',
            ['pagination' => [
                'total' => $assignments->total(),
                'per_page' => $assignments->perPage(),
                'current_page' => $assignments->currentPage(),
                'last_page' => $assignments->lastPage(),
            ]]
        );
    }

    public function assignment(Request $request, DeliveryAssignment $assignment): JsonResponse
    {
        $partner = $this->partnerFor($request->user());

        if ($assignment->delivery_partner_id !== $partner->id) {
            throw new DomainException('You do not have access to this delivery.', 403);
        }

        return Response::success(
            new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder'])),
            'Delivery assignment retrieved.'
        );
    }

    public function accept(Request $request, DeliveryAssignment $assignment): JsonResponse
    {
        $assignment = $this->service->accept($request->user(), $assignment);

        return Response::success(new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder'])), 'Delivery accepted.');
    }

    public function pickup(Request $request, DeliveryAssignment $assignment): JsonResponse
    {
        $assignment = $this->service->pickup($request->user(), $assignment);

        return Response::success(new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder'])), 'Order picked up.');
    }

    public function outForDelivery(Request $request, DeliveryAssignment $assignment): JsonResponse
    {
        [$assignment, $otp] = $this->service->outForDelivery($request->user(), $assignment);

        return Response::success(
            new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder'])),
            'Order is out for delivery.',
            ['otp' => $otp, 'otp_note' => 'MVP: OTP returned for demo; will be sent via SMS in production.']
        );
    }

    public function deliver(DeliveryConfirmationRequest $request, DeliveryAssignment $assignment): JsonResponse
    {
        $assignment = $this->service->deliver($request->user(), $assignment, $request->input('otp'));

        return Response::success(new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder'])), 'Delivery confirmed.');
    }

    public function fail(DeliveryFailureRequest $request, DeliveryAssignment $assignment): JsonResponse
    {
        $assignment = $this->service->fail($request->user(), $assignment, $request->input('reason'));

        return Response::success(new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder'])), 'Delivery marked as failed.');
    }

    public function returnToVendor(Request $request, DeliveryAssignment $assignment): JsonResponse
    {
        $assignment = $this->service->returnToVendor($request->user(), $assignment, $request->input('reason'));

        return Response::success(new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder'])), 'Order returned to vendor.');
    }

    public function availableJobs(Request $request): JsonResponse
    {
        $list = $this->service->availableJobsForPartner($request->user(), [
            'search' => (string) $request->input('search', ''),
            'scope' => (string) $request->input('scope', 'my_area'),
            'page' => $request->integer('page', 1),
            'per_page' => $request->integer('per_page', 15),
        ]);

        return Response::success(
            AvailableJobResource::collection($list),
            'Available delivery jobs retrieved.',
            ['pagination' => [
                'total' => $list->total(),
                'per_page' => $list->perPage(),
                'current_page' => $list->currentPage(),
                'last_page' => $list->lastPage(),
            ]]
        );
    }

    public function availableJobDetail(VendorOrder $vendorOrder): JsonResponse
    {
        $vendorOrder->load(['store.addresses', 'order', 'items']);

        return Response::success(
            new AvailableJobResource($vendorOrder),
            'Available job detail retrieved.'
        );
    }

    public function claim(Request $request, VendorOrder $vendorOrder): JsonResponse
    {
        try {
            $assignment = $this->service->claim($request->user(), $vendorOrder);

            return Response::success(
                new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder', 'deliveryPartner'])),
                'Shipment claimed successfully.'
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function dashboardStats(Request $request): JsonResponse
    {
        $stats = $this->service->partnerDashboardStats($request->user());

        return Response::success($stats, 'Delivery partner dashboard stats retrieved.');
    }

    public function history(Request $request): JsonResponse
    {
        $partner = $this->partnerFor($request->user());

        $history = $partner->assignments()
            ->with(['tracking', 'vendorOrder'])
            ->whereIn('status', ['delivered', 'failed', 'returned_to_vendor'])
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            DeliveryAssignmentResource::collection($history),
            'Delivery history retrieved.',
            ['pagination' => [
                'total' => $history->total(),
                'per_page' => $history->perPage(),
                'current_page' => $history->currentPage(),
                'last_page' => $history->lastPage(),
            ]]
        );
    }

    protected function partnerFor(User $user): DeliveryPartner
    {
        $partner = $user->deliveryPartner;

        if (! $partner) {
            throw new DomainException('No delivery partner profile found for this account.', 404);
        }

        return $partner;
    }
}
