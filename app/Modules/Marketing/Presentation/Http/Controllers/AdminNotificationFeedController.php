<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Marketing\Infrastructure\Models\AdminNotification;
use App\Modules\Marketing\Presentation\Resources\AdminNotificationResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminNotificationFeedController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:admin');
    }

    public function index(Request $request): JsonResponse
    {
        $notifications = AdminNotification::query()
            ->where(function (Builder $q) use ($request) {
                // Global admin broadcasts plus notifications addressed to this admin.
                $q->whereNull('user_id')->orWhere('user_id', $request->user()->id);
            })
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->when($request->input('category'), fn ($q, $category) => $q->where('type', $category))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            AdminNotificationResource::collection($notifications),
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
        $notification = AdminNotification::query()
            ->where('uuid', $notificationId)
            ->where(function (Builder $q) use ($request) {
                $q->whereNull('user_id')->orWhere('user_id', $request->user()->id);
            })
            ->firstOrFail();

        $notification->update(['read_at' => now()]);

        return Response::success(new AdminNotificationResource($notification->fresh()), 'Notification marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        AdminNotification::query()
            ->where(function (Builder $q) use ($request) {
                $q->whereNull('user_id')->orWhere('user_id', $request->user()->id);
            })
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return Response::success(null, 'All notifications marked as read.');
    }

    protected function unreadCount(Request $request): int
    {
        return AdminNotification::query()
            ->where(function (Builder $q) use ($request) {
                $q->whereNull('user_id')->orWhere('user_id', $request->user()->id);
            })
            ->whereNull('read_at')
            ->count();
    }
}