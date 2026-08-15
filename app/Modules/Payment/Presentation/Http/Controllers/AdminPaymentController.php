<?php

namespace App\Modules\Payment\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Payment\Application\Services\RefundService;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Payment\Presentation\Resources\AdminPaymentResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminPaymentController extends Controller
{
    public function __construct(protected RefundService $refundService)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::PAYMENTS_VIEW);
        $this->middleware('permission:'.Permissions::REFUNDS_MANAGE)->only(['refund']);
    }

    public function index(Request $request): JsonResponse
    {
        $payments = Payment::query()
            ->with(['user', 'order', 'refunds'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('method'), fn ($q, $s) => $q->where('method', $s))
            ->when($request->input('provider'), fn ($q, $s) => $q->where('provider', $s))
            ->when($request->input('search'), function ($q, $search) {
                $q->where('payment_number', 'like', "%{$search}%")
                    ->orWhere('provider_transaction_id', 'like', "%{$search}%");
            })
            ->when($request->input('date_from'), fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            AdminPaymentResource::collection($payments),
            'Payments retrieved.',
            ['pagination' => [
                'total' => $payments->total(),
                'per_page' => $payments->perPage(),
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
            ]]
        );
    }

    public function show(string $paymentId): JsonResponse
    {
        $payment = Payment::query()
            ->with(['user', 'order.user', 'refunds.orderItem', 'attempts', 'statusHistory'])
            ->where('uuid', $paymentId)
            ->firstOrFail();

        return Response::success(new AdminPaymentResource($payment), 'Payment retrieved.');
    }

    public function refund(Request $request, string $paymentId): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = Payment::where('uuid', $paymentId)->firstOrFail();

        try {
            $refund = $this->refundService->create($payment, $request->user(), (float) $data['amount'], $data['reason'] ?? null);

            return Response::created($refund, 'Refund requested.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }
}
