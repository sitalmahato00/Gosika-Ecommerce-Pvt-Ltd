<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Marketing\Infrastructure\Models\DeliveryNotification;
use App\Modules\Marketing\Presentation\Resources\DeliveryNotificationResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DeliveryNotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:delivery');
    }

    public function index(Request $request): JsonResponse
    {
        $partner = $this->partnerFor($request);

        $notifications = DeliveryNotification::query()
            ->where(function ($q) use ($partner, $request) {
                $q->where('delivery_partner_id', $partner->id)->orWhere('user_id', $request->user()->id);
            })
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->when($request->input('category'), fn ($q, $category) => $q->where('type', $category))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            DeliveryNotificationResource::collection($notifications),
            'Notifications retrieved.',
            [
                'pagination' => [
                    'total' => $notifications->total(),
                    'per_page' => $notifications->perPage(),
                    'current_page' => $notifications->currentPage(),
                    'last_page' => $notifications->lastPage(),
                ],
                'unread_count' => $this->unreadCount($request),
            ]
        );
    }

    public function unread(Request $request): JsonResponse
    {
        return Response::success([
            'unread_count' => $this->unreadCount($request),
        ], 'Unread notification count retrieved.');
    }

    public function markRead(Request $request, string $notificationId): JsonResponse
    {
        $partner = $this->partnerFor($request);
        $notification = DeliveryNotification::query()
            ->where('uuid', $notificationId)
            ->where(function ($q) use ($partner, $request) {
                $q->where('delivery_partner_id', $partner->id)->orWhere('user_id', $request->user()->id);
            })
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return Response::success(new DeliveryNotificationResource($notification->fresh()), 'Notification marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $partner = $this->partnerFor($request);

        DeliveryNotification::query()
            ->where(function ($q) use ($partner, $request) {
                $q->where('delivery_partner_id', $partner->id)->orWhere('user_id', $request->user()->id);
            })
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return Response::success(null, 'All notifications marked as read.');
    }

    protected function partnerFor(Request $request)
    {
        $partner = $request->user()->deliveryPartner;

        if (! $partner) {
            throw new DomainException('You must be a delivery partner to access notifications.', 403);
        }

        return $partner;
    }

    protected function unreadCount(Request $request): int
    {
        $partner = $this->partnerFor($request);

        return DeliveryNotification::query()
            ->where(function ($q) use ($partner, $request) {
                $q->where('delivery_partner_id', $partner->id)->orWhere('user_id', $request->user()->id);
            })
            ->whereNull('read_at')
            ->count();
    }
}