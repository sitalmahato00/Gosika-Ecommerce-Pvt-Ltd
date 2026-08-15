<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Shipping\Application\Services\DeliveryService;
use App\Modules\Shipping\Presentation\Resources\DeliveryTrackingResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DeliveryTrackingController extends Controller
{
    public function __construct(protected DeliveryService $service)
    {
        $this->middleware('auth:sanctum');
    }

    public function orderTracking(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();
        $this->assertCanView($user, $order);

        $tracking = $this->service->trackingForOrder($order);

        return Response::success(DeliveryTrackingResource::collection($tracking), 'Delivery tracking retrieved.');
    }

    protected function assertCanView($user, Order $order): void
    {
        if ($order->user_id === $user->id) {
            return;
        }

        if ($user->hasRole(Roles::SUPER_ADMIN)) {
            return;
        }

        if ($user->vendor && $order->vendorOrders()->where('vendor_id', $user->vendor->id)->exists()) {
            return;
        }

        if ($user->deliveryPartner && $order->vendorOrders()->whereHas('assignments', fn ($q) => $q->where('delivery_partner_id', $user->deliveryPartner->id))->exists()) {
            return;
        }

        throw new DomainException('You do not have access to this order\'s tracking.', 403);
    }
}
