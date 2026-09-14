<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketing\Infrastructure\Models\VendorNotification;
use App\Modules\Marketing\Presentation\Resources\VendorNotificationResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class VendorNotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $notifications = VendorNotification::query()
            ->where(function ($q) use ($vendor, $request) {
                $q->where('vendor_id', $vendor->id)->orWhere('user_id', $request->user()->id);
            })
            ->when($request->input('unread'), fn ($q) => $q->whereNull('read_at'))
            ->when($request->input('category'), fn ($q, $category) => $q->where('type', $category))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorNotificationResource::collection($notifications),
            'Notifications retrieved.',
            ['pagination' => [
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
            ], 'unread_count' => $this->unreadCount($vendor, $request)]
        );
    }

    public function unread(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        return Response::success([
            'unread_count' => $this->unreadCount($vendor, $request),
        ], 'Unread notification count retrieved.');
    }

    protected function unreadCount(Vendor $vendor, Request $request): int
    {
        return VendorNotification::query()
            ->where(function ($q) use ($vendor, $request) {
                $q->where('vendor_id', $vendor->id)->orWhere('user_id', $request->user()->id);
            })
            ->whereNull('read_at')
            ->count();
    }

    public function markRead(Request $request, string $notificationId): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $notification = VendorNotification::where('uuid', $notificationId)->where('vendor_id', $vendor->id)->firstOrFail();
        $notification->update(['read_at' => now()]);

        return Response::success(new VendorNotificationResource($notification->fresh()), 'Notification marked as read.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        VendorNotification::where('vendor_id', $vendor->id)->update(['read_at' => now()]);

        return Response::success(null, 'All notifications marked as read.');
    }

    public function clearRead(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        VendorNotification::where('vendor_id', $vendor->id)->whereNotNull('read_at')->delete();

        return Response::success(null, 'Read notifications cleared.');
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access notifications.', 403);
        }

        return $vendor;
    }
}
