<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Infrastructure\Models\Broadcast;
use App\Modules\Marketing\Presentation\Resources\BroadcastResource;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminNotificationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
        $this->middleware('permission:'.Permissions::USERS_UPDATE);
    }

    public function index(Request $request): JsonResponse
    {
        $broadcasts = Broadcast::query()
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            BroadcastResource::collection($broadcasts),
            'Notifications retrieved.',
            ['pagination' => [
                'total' => $broadcasts->total(),
                'per_page' => $broadcasts->perPage(),
                'current_page' => $broadcasts->currentPage(),
                'last_page' => $broadcasts->lastPage(),
            ]]
        );
    }

    public function send(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'max:5000'],
            'channel' => ['required', 'in:in_app,email,sms,push'],
            'target_type' => ['required', 'in:all,customers,vendors,delivery'],
            'target_ids' => ['array'],
        ]);

        $reach = $this->reach($data['target_type'], $data['target_ids'] ?? []);

        $broadcast = Broadcast::create([
            'title' => $data['title'],
            'message' => $data['message'],
            'channel' => $data['channel'],
            'target_type' => $data['target_type'],
            'target_ids' => $data['target_ids'] ?? null,
            'status' => 'sent',
            'reach' => $reach,
            'sent_at' => now(),
            'created_by' => $request->user()->id,
        ]);

        app(AuditLogService::class)->record($request->user(), 'notification.sent', 'notification', $broadcast->uuid, null, ['title' => $broadcast->title, 'channel' => $broadcast->channel, 'reach' => $reach]);

        \Illuminate\Support\Facades\Log::info('Notification broadcast sent', [
            'broadcast' => $broadcast->uuid,
            'target' => $data['target_type'],
            'reach' => $reach,
        ]);

        return Response::created(new BroadcastResource($broadcast), 'Notification sent.');
    }

    protected function reach(string $targetType, array $targetIds): int
    {
        $role = match ($targetType) {
            'customers' => Roles::CUSTOMER,
            'vendors' => Roles::VENDOR_ADMIN,
            'delivery' => Roles::DELIVERY_PARTNER,
            default => null,
        };

        $query = User::query()->where('status', UserStatus::ACTIVE);

        if ($role) {
            $query->role($role);
        }

        if (! empty($targetIds)) {
            $query->whereIn('uuid', $targetIds);
        }

        return $query->count();
    }
}
