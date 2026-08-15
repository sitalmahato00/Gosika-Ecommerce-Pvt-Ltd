<?php

namespace App\Modules\Payment\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Payment\Application\Services\RefundService;
use App\Modules\Payment\Infrastructure\Models\Refund;
use App\Modules\Payment\Presentation\Resources\AdminRefundResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminRefundController extends Controller
{
    public function __construct(protected RefundService $refundService)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::REFUNDS_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $refunds = Refund::query()
            ->with(['payment', 'order.user', 'orderItem'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('refund_number', 'like', "%{$search}%")
                        ->orWhereHas('order', fn ($o) => $o->where('order_number', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            AdminRefundResource::collection($refunds),
            'Refunds retrieved.',
            ['pagination' => [
                'total' => $refunds->total(),
                'per_page' => $refunds->perPage(),
                'current_page' => $refunds->currentPage(),
                'last_page' => $refunds->lastPage(),
            ]]
        );
    }

    public function show(string $refundId): JsonResponse
    {
        $refund = Refund::query()
            ->with(['payment', 'order.user', 'orderItem', 'initiatedBy'])
            ->where('uuid', $refundId)
            ->firstOrFail();

        return Response::success(new AdminRefundResource($refund), 'Refund retrieved.');
    }

    public function approve(string $refundId): JsonResponse
    {
        $refund = Refund::where('uuid', $refundId)->firstOrFail();

        try {
            $refund = $this->refundService->approve(request()->user(), $refund);
            app(AuditLogService::class)->record(request()->user(), 'refund.approved', 'refund', $refund->uuid, ['status' => 'requested'], ['status' => $refund->status->value]);

            return Response::success(new AdminRefundResource($refund), 'Refund approved.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function reject(Request $request, string $refundId): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $refund = Refund::where('uuid', $refundId)->firstOrFail();

        try {
            $refund = $this->refundService->reject(request()->user(), $refund, $request->input('reason'));
            app(AuditLogService::class)->record(request()->user(), 'refund.rejected', 'refund', $refund->uuid, ['status' => 'requested'], ['status' => 'rejected', 'reason' => $request->input('reason')]);

            return Response::success(new AdminRefundResource($refund), 'Refund rejected.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }
}
