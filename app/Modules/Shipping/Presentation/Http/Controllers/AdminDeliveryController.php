<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\DeliveryPartnerStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Shipping\Application\Services\DeliveryService;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use App\Modules\Shipping\Infrastructure\Models\DeliveryPartner;
use App\Modules\Shipping\Presentation\Http\Requests\AssignDeliveryRequest;
use App\Modules\Shipping\Presentation\Http\Requests\ReassignDeliveryRequest;
use App\Modules\Shipping\Presentation\Resources\DeliveryAssignmentResource;
use App\Modules\Shipping\Presentation\Resources\DeliveryPartnerResource;
use App\Modules\Shipping\Presentation\Resources\DispatchItemResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;

class AdminDeliveryController extends Controller
{
    public function __construct(protected DeliveryService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::DELIVERY_PARTNERS_MANAGE.'|'.Permissions::DELIVERIES_MANAGE);
        $this->middleware('permission:'.Permissions::DELIVERY_PARTNERS_MANAGE)->only(['partners', 'partner', 'approve', 'reject', 'suspend', 'activate']);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $data = $this->service->dashboard($this->resolveRange($request));

        return Response::success($data, 'Delivery dashboard retrieved.');
    }

    public function dispatch(Request $request): JsonResponse
    {
        $list = $this->service->dispatchList([
            'status' => (string) $request->input('status', 'all'),
            'search' => (string) $request->input('search', ''),
            'partner_id' => (string) $request->input('partner_id', ''),
            'store_id' => (string) $request->input('store_id', ''),
            'payment_method' => (string) $request->input('payment_method', ''),
            'from' => (string) $request->input('from', ''),
            'to' => (string) $request->input('to', ''),
            'per_page' => $request->integer('per_page', 15),
        ]);

        $summary = $this->service->dispatchSummary();

        return Response::success(
            DispatchItemResource::collection($list),
            'Order dispatch list retrieved.',
            [
                'pagination' => [
                    'total' => $list->total(),
                    'per_page' => $list->perPage(),
                    'current_page' => $list->currentPage(),
                    'last_page' => $list->lastPage(),
                ],
                'summary' => $summary,
            ]
        );
    }

    public function dispatchDetail(VendorOrder $vendorOrder): JsonResponse
    {
        return Response::success($this->service->dispatchDetail($vendorOrder), 'Order dispatch detail retrieved.');
    }

    public function dispatchPartners(VendorOrder $vendorOrder): JsonResponse
    {
        return Response::success(
            ['eligible_partners' => $this->service->eligiblePartnersForOrder($vendorOrder)],
            'Eligible delivery partners retrieved.'
        );
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

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^[0-9+\- ]{7,20}$/', 'unique:delivery_partners,phone'],
            'vehicle_type' => ['nullable', 'string', 'max:40'],
            'vehicle_number' => ['nullable', 'string', 'max:30'],
            'service_areas' => ['nullable', 'array'],
            'service_areas.*' => ['string', 'max:120'],
            'password' => ['required', 'string', 'min:8'],
            'province' => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::query()->create([
            'first_name' => explode(' ', trim((string) $data['name']))[0] ?? trim((string) $data['name']),
            'last_name' => trim(substr((string) $data['name'], strlen(explode(' ', trim((string) $data['name']))[0] ?? ''))),
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => bcrypt($data['password']),
            'status' => 'active',
        ]);

        $user->assignRole(Roles::DELIVERY_PARTNER);

        $areas = array_values(array_filter(array_map('trim', (array) ($data['service_areas'] ?? []))));

        $partner = DeliveryPartner::query()->create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'phone' => $data['phone'],
            'email' => $data['email'],
            'vehicle_type' => $data['vehicle_type'] ?? null,
            'vehicle_number' => $data['vehicle_number'] ?? null,
            'service_areas' => $areas,
            'status' => DeliveryPartnerStatus::APPROVED,
            'is_online' => false,
            'meta' => ['assigned_province' => $data['province'] ?? null],
        ]);

        return Response::created(new DeliveryPartnerResource($partner->load('user')), 'Delivery partner account created.');
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
        $vendorOrderId = (string) $request->input('vendor_order_id');
        $vendorOrder = VendorOrder::where('uuid', $vendorOrderId)
            ->when(ctype_digit($vendorOrderId), fn ($q) => $q->orWhere('id', (int) $vendorOrderId))
            ->firstOrFail();

        $partnerId = (string) $request->input('delivery_partner_id');
        $partner = $request->filled('delivery_partner_id')
            ? DeliveryPartner::where('uuid', $partnerId)
                ->when(ctype_digit($partnerId), fn ($q) => $q->orWhere('id', (int) $partnerId))
                ->firstOrFail()
            : $this->service->resolvePartnerForOrder($vendorOrder);

        try {
            $assignment = $this->service->assign(
                $request->user(),
                $vendorOrder,
                $partner,
                $request->filled('delivery_fee') ? (float) $request->input('delivery_fee') : null,
                $request->filled('cod_amount') ? (float) $request->input('cod_amount') : null,
                $request->input('notes'),
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
        $partnerId = (string) $request->input('delivery_partner_id');
        $partner = DeliveryPartner::where('uuid', $partnerId)
            ->when(ctype_digit($partnerId), fn ($q) => $q->orWhere('id', (int) $partnerId))
            ->firstOrFail();

        try {
            $assignment = $this->service->reassign(
                $request->user(),
                $assignment,
                $partner,
                $request->filled('delivery_fee') ? (float) $request->input('delivery_fee') : null,
                $request->filled('cod_amount') ? (float) $request->input('cod_amount') : null,
                (string) $request->input('reason'),
                $request->input('notes'),
            );

            return Response::success(
                new DeliveryAssignmentResource($assignment->load(['tracking', 'vendorOrder', 'deliveryPartner'])),
                'Delivery reassigned.'
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    protected function resolveRange(Request $request): array
    {
        $range = (string) $request->input('range', 'today');
        $now = now();

        return match ($range) {
            'yesterday' => [$now->copy()->subDay()->startOfDay(), $now->copy()->subDay()->endOfDay(), 'Yesterday'],
            '7d' => [$now->copy()->subDays(6)->startOfDay(), $now->copy()->endOfDay(), 'Last 7 Days'],
            'custom' => [
                $this->parseDate($request->input('from'), $now->copy()->startOfDay()),
                $this->parseDate($request->input('to'), $now->copy()->endOfDay()),
                'Custom Range',
            ],
            default => [$now->copy()->startOfDay(), $now->copy()->endOfDay(), 'Today'],
        };
    }

    protected function parseDate(mixed $value, Carbon $fallback): Carbon
    {
        if (! is_string($value) || $value === '') {
            return $fallback;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return $fallback;
        }
    }
}
