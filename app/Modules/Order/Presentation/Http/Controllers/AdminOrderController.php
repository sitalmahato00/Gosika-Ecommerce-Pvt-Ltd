<?php

namespace App\Modules\Order\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Order\Application\Services\OrderService;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Presentation\Resources\AdminOrderResource;
use App\Modules\Payment\Application\Services\PaymentService;
use App\Modules\Payment\Application\Services\RefundService;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Payment\Presentation\Resources\AdminRefundResource;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use App\Modules\Shared\Presentation\Http\Filters\ListingDateRange;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected RefundService $refundService,
        protected PaymentService $paymentService
    ) {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
        $this->middleware('permission:'.Permissions::ORDERS_VIEW.'|'.Permissions::ORDERS_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'payment_status' => ['nullable', Rule::enum(OrderPaymentStatus::class)],
            'payment_method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Order::query()
            ->with(['user', 'items', 'vendorOrders'])
            ->when($filters['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($filters['payment_status'] ?? null, fn ($q, $s) => $q->where('payment_status', $s))
            ->when($filters['payment_method'] ?? null, fn ($q, $s) => $q->where('payment_method', $s))
            ->when($filters['search'] ?? null, function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('order_number', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($user) => $user
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('placed_at')
            ->orderByDesc('id');

        ListingDateRange::apply($query, $request, 'placed_at');

        $orders = $query->paginate((int) ($filters['per_page'] ?? 15))->withQueryString();

        return Response::success(
            AdminOrderResource::collection($orders),
            'Orders retrieved.',
            ['pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ]]
        );
    }

    public function show(string $orderId): JsonResponse
    {
        $order = Order::query()
            ->with(['user', 'items', 'vendorOrders.items', 'vendorOrders.store', 'vendorOrders.assignments.deliveryPartner', 'payments', 'shippingAddress'])
            ->where(function ($q) use ($orderId) {
                $q->where('uuid', $orderId)
                    ->orWhere('order_number', $orderId);
                if (ctype_digit($orderId)) {
                    $q->orWhere('id', (int) $orderId);
                }
            })
            ->firstOrFail();

        return Response::success(new AdminOrderResource($order), 'Order retrieved.');
    }

    public function returns(Request $request): JsonResponse
    {
        $query = ReturnRequest::query()
            ->with(['user', 'order', 'vendorOrder', 'orderItem', 'store'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search')->trim().'%';
                $q->where(function ($inner) use ($term) {
                    $inner->where('return_number', 'like', $term)
                        ->orWhere('reason', 'like', $term)
                        ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', $term))
                        ->orWhereHas('user', fn ($user) => $user
                            ->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('email', 'like', $term))
                        ->orWhereHas('store', fn ($store) => $store->where('name', 'like', $term));
                });
            })
            ->orderByDesc('created_at');

        ListingDateRange::apply($query, $request, 'created_at');

        $returns = $query->paginate(min(max($request->integer('per_page', 20), 1), 100))->withQueryString();

        return Response::success(
            $returns->items(),
            'Return requests retrieved.',
            ['pagination' => [
                'total' => $returns->total(),
                'per_page' => $returns->perPage(),
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
            ]]
        );
    }

    public function approveReturn(Request $request, string $returnId): JsonResponse
    {
        $return = ReturnRequest::where('uuid', $returnId)
            ->when(ctype_digit($returnId), fn ($q) => $q->orWhere('id', (int) $returnId))
            ->firstOrFail();
        $return->status = ReturnStatus::APPROVED;
        $return->reviewed_by = $request->user()->id;
        $return->reviewed_at = now();
        $return->review_notes = $request->input('notes', 'Approved by admin');
        $return->save();

        return Response::success($return, 'Return request approved.');
    }

    public function rejectReturn(Request $request, string $returnId): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $return = ReturnRequest::where('uuid', $returnId)
            ->when(ctype_digit($returnId), fn ($q) => $q->orWhere('id', (int) $returnId))
            ->firstOrFail();
        $return->status = ReturnStatus::REJECTED;
        $return->reviewed_by = $request->user()->id;
        $return->reviewed_at = now();
        $return->review_notes = $request->input('reason');
        $return->save();

        return Response::success($return, 'Return request rejected.');
    }

    public function updateReturnStatus(Request $request, string $returnId): JsonResponse
    {
        $request->validate([
            'status' => ['required', Rule::enum(ReturnStatus::class)],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $return = ReturnRequest::where('uuid', $returnId)
            ->when(ctype_digit($returnId), fn ($q) => $q->orWhere('id', (int) $returnId))
            ->firstOrFail();
        $return->status = ReturnStatus::from($request->input('status'));

        if ($request->filled('notes')) {
            $return->review_notes = $request->input('notes');
        }

        if (in_array($return->status->value, [
            ReturnStatus::APPROVED->value,
            ReturnStatus::REJECTED->value,
            ReturnStatus::COLLECTED->value,
            ReturnStatus::INSPECTED->value,
            ReturnStatus::REFUND_PENDING->value,
            ReturnStatus::REFUNDED->value,
            ReturnStatus::COMPLETED->value,
            ReturnStatus::CANCELLED->value,
        ], true)) {
            $return->reviewed_by = $return->reviewed_by ?? $request->user()->id;
            $return->reviewed_at = $return->reviewed_at ?? now();
        }

        $return->save();

        return Response::success(
            $return->load(['user', 'order', 'vendorOrder', 'orderItem', 'store']),
            'Return request status updated.'
        );
    }

    public function processReturnRefund(Request $request, string $returnId): JsonResponse
    {
        $request->validate([
            'method' => ['required', Rule::in(['esewa', 'khalti', 'fonepay', 'cod'])],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $return = ReturnRequest::query()
            ->with(['order.payments', 'orderItem', 'vendorOrder'])
            ->where('uuid', $returnId)
            ->when(ctype_digit($returnId), fn ($q) => $q->orWhere('id', (int) $returnId))
            ->firstOrFail();

        $refundable = [
            ReturnStatus::UNDER_REVIEW->value,
            ReturnStatus::APPROVED->value,
            ReturnStatus::COLLECTED->value,
            ReturnStatus::INSPECTED->value,
            ReturnStatus::REFUND_PENDING->value,
        ];

        if (! in_array($return->status->value, $refundable, true)) {
            return Response::error(
                'This return cannot be refunded in its current state.',
                ['status' => $return->status->value],
                422
            );
        }

        $amount = round((float) ($request->input('amount') ?? $return->refund_amount), 2);
        $payment = $return->order->payments->first(fn ($p) => $p->status->value === 'paid');

        if (! $payment) {
            $method = $request->input('method');
            $payment = Payment::query()->create([
                'payment_number' => ReferenceNumber::unique('PAY'),
                'order_id' => $return->order_id,
                'vendor_order_id' => $return->vendor_order_id,
                'user_id' => $return->user_id,
                'amount' => (float) $return->order->grand_total,
                'currency' => $return->order->currency ?? 'NPR',
                'method' => $method,
                'provider' => $method === 'cod' ? 'manual' : $method,
                'status' => 'paid',
                'initiated_at' => now(),
                'verified_at' => now(),
            ]);
        }

        $gateway = null;
        if ($payment->method === 'esewa') {
            $check = $this->paymentService->esewaRefundCheck($payment);

            if (($check['available'] ?? false) && in_array($check['status'], ['FULL_REFUND', 'PARTIAL_REFUND'], true)) {
                return Response::error(
                    'This payment has already been refunded at eSewa (status: '.$check['status'].').',
                    ['gateway_status' => $check['status']],
                    422
                );
            }

            $gateway = ['provider_response' => ['esewa_check' => $check['raw'] ?? $check]];

            if (($check['available'] ?? false) && $check['ref_id'] !== '') {
                $gateway['provider_refund_id'] = $check['ref_id'];
            }
        }

        try {
            $refund = $this->refundService->create(
                $payment,
                $request->user(),
                $amount,
                $request->input('notes') ?? "Refund for return {$return->return_number}",
                $gateway
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }

        $return->status = ReturnStatus::REFUND_PENDING;
        $return->reviewed_by = $return->reviewed_by ?? $request->user()->id;
        $return->reviewed_at = $return->reviewed_at ?? now();
        $return->save();

        $message = ($payment->method === 'esewa' && ! ($gateway['provider_response']['esewa_check']['available'] ?? true))
            ? 'Refund created. eSewa verification was unavailable — finalize the payout from the eSewa merchant dashboard.'
            : 'Refund created for return request.';

        return Response::success(
            new AdminRefundResource($refund->load('payment', 'order', 'orderItem')),
            $message
        );
    }

    public function cancel(Request $request, string $orderId): JsonResponse
    {
        $order = Order::where('uuid', $orderId)->firstOrFail();

        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $oldStatus = $order->status->value;
            $order = $this->orderService->cancel($request->user(), $order, $request->input('reason'));
            app(AuditLogService::class)->record(
                $request->user(),
                'order.cancelled',
                'order',
                $order->uuid,
                ['status' => $oldStatus],
                ['status' => 'cancelled', 'reason' => $request->input('reason')]
            );

            return Response::success(new AdminOrderResource($order), 'Order cancelled.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }
}
