<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Shipping\Infrastructure\Models\Courier;
use App\Modules\Shipping\Infrastructure\Models\ShippingZone;
use App\Modules\Shipping\Presentation\Resources\CourierResource;
use App\Modules\Shipping\Presentation\Resources\ShippingZoneResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminShippingController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::DELIVERIES_MANAGE);
    }

    public function zones(Request $request): JsonResponse
    {
        $zones = ShippingZone::query()
            ->when($request->input('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->integer('per_page', 50));

        return Response::success(
            ShippingZoneResource::collection($zones),
            'Shipping zones retrieved.',
            ['pagination' => [
                'total' => $zones->total(),
                'per_page' => $zones->perPage(),
                'current_page' => $zones->currentPage(),
                'last_page' => $zones->lastPage(),
            ]]
        );
    }

    public function storeZone(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:1000'],
            'provinces' => ['array'],
            'provinces.*' => ['string', 'max:120'],
            'standard_charge' => ['required', 'numeric', 'min:0'],
            'express_charge' => ['required', 'numeric', 'min:0'],
            'estimated_days' => ['required', 'integer', 'min:1', 'max:30'],
            'is_active' => ['boolean'],
        ]);

        $zone = ShippingZone::create($data);

        return Response::created(new ShippingZoneResource($zone), 'Shipping zone created.');
    }

    public function updateZone(Request $request, string $zoneId): JsonResponse
    {
        $zone = ShippingZone::where('uuid', $zoneId)->firstOrFail();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:1000'],
            'provinces' => ['array'],
            'provinces.*' => ['string', 'max:120'],
            'standard_charge' => ['sometimes', 'numeric', 'min:0'],
            'express_charge' => ['sometimes', 'numeric', 'min:0'],
            'estimated_days' => ['sometimes', 'integer', 'min:1', 'max:30'],
            'is_active' => ['boolean'],
        ]);

        $zone->update($data);

        return Response::success(new ShippingZoneResource($zone->fresh()), 'Shipping zone updated.');
    }

    public function deleteZone(string $zoneId): JsonResponse
    {
        ShippingZone::where('uuid', $zoneId)->firstOrFail()->delete();

        return Response::success(null, 'Shipping zone deleted.');
    }

    public function couriers(Request $request): JsonResponse
    {
        $couriers = Courier::query()
            ->when($request->input('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->integer('per_page', 50));

        return Response::success(
            CourierResource::collection($couriers),
            'Couriers retrieved.',
            ['pagination' => [
                'total' => $couriers->total(),
                'per_page' => $couriers->perPage(),
                'current_page' => $couriers->currentPage(),
                'last_page' => $couriers->lastPage(),
            ]]
        );
    }

    public function storeCourier(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'code' => ['nullable', 'string', 'max:60', 'unique:couriers,code'],
            'logo' => ['nullable', 'string', 'max:500'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'tracking_url_pattern' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $courier = Courier::create($data);

        return Response::created(new CourierResource($courier), 'Courier created.');
    }

    public function updateCourier(Request $request, string $courierId): JsonResponse
    {
        $courier = Courier::where('uuid', $courierId)->firstOrFail();

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:180'],
            'code' => ['nullable', 'string', 'max:60', 'unique:couriers,code,'.$courier->id],
            'logo' => ['nullable', 'string', 'max:500'],
            'contact_phone' => ['nullable', 'string', 'max:30'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'tracking_url_pattern' => ['nullable', 'string', 'max:500'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]);

        $courier->update($data);

        return Response::success(new CourierResource($courier->fresh()), 'Courier updated.');
    }

    public function deleteCourier(string $courierId): JsonResponse
    {
        Courier::where('uuid', $courierId)->firstOrFail()->delete();

        return Response::success(null, 'Courier deleted.');
    }
}
