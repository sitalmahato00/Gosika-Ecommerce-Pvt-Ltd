<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Shipping\Application\DataTransferObjects\ApplyDeliveryPartnerDTO;
use App\Modules\Shipping\Application\DataTransferObjects\UpdateDeliveryPartnerProfileDTO;
use App\Modules\Shipping\Application\Services\DeliveryService;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Shipping\Presentation\Http\Requests\ApplyDeliveryPartnerRequest;
use App\Modules\Shipping\Presentation\Http\Requests\DeliveryConfirmationRequest;
use App\Modules\Shipping\Presentation\Http\Requests\DeliveryFailureRequest;
use App\Modules\Shipping\Presentation\Http\Requests\UpdateDeliveryPartnerProfileRequest;
use App\Modules\Shipping\Presentation\Resources\DeliveryAssignmentResource;
use App\Modules\Shipping\Presentation\Resources\DeliveryPartnerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DeliveryPartnerController extends Controller
{
    public function __construct(protected DeliveryService $service)
    {
        $this->middleware('auth:sanctum');
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

        return Response::success(new DeliveryPartnerResource($partner), 'Delivery partner profile retrieved.');
    }

    public function updateProfile(UpdateDeliveryPartnerProfileRequest $request): JsonResponse
    {
        $partner = $this->service->updateProfile(
            $request->user(),
            UpdateDeliveryPartnerProfileDTO::fromArray($request->validated())
        );

        return Response::success(new DeliveryPartnerResource($partner), 'Delivery partner profile updated.');
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
