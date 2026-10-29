<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Marketing\Infrastructure\Models\CustomerNotification;
use App\Modules\Marketing\Presentation\Resources\CustomerNotificationResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CustomerNotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $notifications = CustomerNotification::query()
            ->where('user_id', $request->user()->id)
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->when($request->input('category'), fn ($q, $category) => $q->where('type', $category))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            CustomerNotificationResource::collection($notifications),
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

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $notificationModel = CustomerNotification::query()
            ->where('user_id', $request->user()->id)
            ->where(function ($q) use ($notification) {
                $q->where('uuid', $notification);
                if (ctype_digit((string) $notification)) {
                    $q->orWhere('id', (int) $notification);
                }
            })
            ->firstOrFail();

        $notificationModel->update(['read_at' => now()]);

        return Response::success(new CustomerNotificationResource($notificationModel->fresh()), 'Notification marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        CustomerNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return Response::success(null, 'All notifications marked as read.');
    }

    public function clearRead(Request $request): JsonResponse
    {
        CustomerNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNotNull('read_at')
            ->delete();

        return Response::success(null, 'Read notifications cleared.');
    }

    protected function unreadCount(Request $request): int
    {
        return CustomerNotification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();
    }
}