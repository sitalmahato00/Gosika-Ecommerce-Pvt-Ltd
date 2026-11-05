<?php

namespace App\Modules\Payment\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
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
        $this->middleware('permission:'.Permissions::ORDERS_MANAGE.'|'.Permissions::REFUNDS_MANAGE);
    }

    public function updateReturnRefundStatus(Request $request, string $returnId, string $refundId): JsonResponse
    {
        $return = ReturnRequest::where('uuid', $returnId)
            ->when(ctype_digit($returnId), fn ($q) => $q->orWhere('id', (int) $returnId))
            ->firstOrFail();
        $refund = Refund::where('return_request_id', $return->id)
            ->where(function ($query) use ($refundId) {
                $query->where('uuid', $refundId);
                if (ctype_digit($refundId)) {
                    $query->orWhere('id', (int) $refundId);
                }
            })
            ->firstOrFail();

        return $this->applyStatusUpdate($request, $refund);
    }

    private function applyStatusUpdate(Request $request, Refund $refund): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::enum(RefundStatus::class)],
            'provider_refund_id' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($refund->status->value === RefundStatus::REFUNDED->value) {
            return Response::error('A refunded transaction cannot be modified.', ['status' => 'refunded'], 422);
        }

        $newStatus = RefundStatus::from($request->input('status'));
        $message = 'Refund status updated.';
        $providerResponse = [];
        $refund->load('payment');

        if ($newStatus === RefundStatus::REFUNDED && $refund->payment?->method === 'esewa') {
            $check = $this->paymentService->esewaRefundCheck($refund->payment);

            if ($check['available'] ?? false) {
                $gatewayStatus = (string) $check['status'];

                if (in_array($gatewayStatus, ['FULL_REFUND', 'PARTIAL_REFUND'], true)) {
                    if (! $refund->provider_refund_id && $check['ref_id'] !== '') {
                        $refund->provider_refund_id = (string) $check['ref_id'];
                    }

                    $providerResponse['esewa_completed'] = $check['raw'] ?? $check;
                    $message = 'Refund finalized — verified at eSewa (status: '.$gatewayStatus.').';
                } elseif ($gatewayStatus === 'COMPLETE') {
                    return Response::error(
                        'eSewa reports this payment as not yet refunded (status: COMPLETE). Confirm the customer payout from the eSewa merchant dashboard before finalizing.',
                        ['gateway_status' => 'COMPLETE'],
                        422
                    );
                }
            } else {
                $providerResponse['esewa_check'] = [
                    'available' => false,
                    'reason' => $check['reason'] ?? 'unavailable',
                    'message' => $check['message'] ?? null,
                ];
                $message = 'Refund finalized (could not verify with eSewa — confirm the payout from the eSewa merchant dashboard).';
            }
        }

        try {
            $refund = $this->refundService->updateStatus(
                $request->user(),
                $refund,
                $newStatus,
                $request->input('provider_refund_id') ?? $refund->provider_refund_id,
                $providerResponse ?: null
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }

        return Response::success(
            new AdminRefundResource($refund->load('payment', 'order', 'orderItem')),
            $message
        );
    }
}
