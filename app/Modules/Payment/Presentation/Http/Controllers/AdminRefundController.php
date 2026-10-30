<?php

namespace App\Modules\Payment\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Payment\Application\Services\PaymentService;
use App\Modules\Payment\Application\Services\RefundService;
use App\Modules\Payment\Infrastructure\Models\Refund;
use App\Modules\Payment\Presentation\Resources\AdminRefundResource;
use App\Modules\Shared\Domain\Enums\RefundStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class AdminRefundController extends Controller
{
    public function __construct(protected RefundService $refundService, protected PaymentService $paymentService)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
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

    public function updateStatus(Request $request, string $refundId): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::enum(RefundStatus::class)],
            'provider_refund_id' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $refund = Refund::where('uuid', $refundId)
            ->when(ctype_digit($refundId), fn ($q) => $q->orWhere('id', (int) $refundId))
            ->firstOrFail();

        if ($refund->status->value === RefundStatus::REFUNDED->value) {
            return Response::error('A refunded transaction cannot be modified.', ['status' => 'refunded'], 422);
        }

        $newStatus = RefundStatus::from($request->input('status'));
        $refund->status = $newStatus;

        $message = 'Refund status updated.';
        $refund->load('payment');

        if ($newStatus === RefundStatus::REFUNDED && $refund->payment?->method === 'esewa') {
            $check = $this->paymentService->esewaRefundCheck($refund->payment);

            if ($check['available'] ?? false) {
                $gatewayStatus = (string) $check['status'];

                if (in_array($gatewayStatus, ['FULL_REFUND', 'PARTIAL_REFUND'], true)) {
                    if (! $refund->provider_refund_id && $check['ref_id'] !== '') {
                        $refund->provider_refund_id = (string) $check['ref_id'];
                    }

                    $refund->provider_response = array_merge($refund->provider_response ?? [], ['esewa_completed' => $check['raw'] ?? $check]);
                    $message = 'Refund finalized — verified at eSewa (status: '.$gatewayStatus.').';
                } elseif ($gatewayStatus === 'COMPLETE') {
                    return Response::error(
                        'eSewa reports this payment as not yet refunded (status: COMPLETE). Confirm the customer payout from the eSewa merchant dashboard before finalizing.',
                        ['gateway_status' => 'COMPLETE'],
                        422
                    );
                }
            } else {
                $refund->provider_response = array_merge($refund->provider_response ?? [], [
                    'esewa_check' => [
                        'available' => false,
                        'reason' => $check['reason'] ?? 'unavailable',
                        'message' => $check['message'] ?? null,
                    ],
                ]);
                $message = 'Refund finalized (could not verify with eSewa — confirm the payout from the eSewa merchant dashboard).';
            }
        }

        if ($request->filled('provider_refund_id')) {
            $refund->provider_refund_id = $request->input('provider_refund_id');
        }

        $refund->completed_at = in_array($newStatus->value, [
            RefundStatus::REFUNDED->value,
            RefundStatus::FAILED->value,
            RefundStatus::CANCELLED->value,
        ], true) ? now() : null;

        $refund->save();

        return Response::success(
            new AdminRefundResource($refund->load('payment', 'order', 'orderItem')),
            $message
        );
    }
}
