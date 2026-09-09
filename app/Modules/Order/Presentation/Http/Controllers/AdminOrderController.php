<?php

namespace App\Modules\Order\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Order\Application\Services\OrderService;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Presentation\Resources\AdminOrderResource;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminOrderController extends Controller
{
    public function __construct(protected OrderService $orderService)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::ORDERS_VIEW.'|'.Permissions::ORDERS_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->with(['user', 'items', 'vendorOrders'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('payment_status'), fn ($q, $s) => $q->where('payment_status', $s))
            ->when($request->input('payment_method'), fn ($q, $s) => $q->where('payment_method', $s))
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('order_number', 'like', "%{$search}%");
                });
            })
            ->when($request->input('date_from'), fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate($request->integer('per_page', 15));

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

    /**
     * Multi-vendor / split orders: a single checkout that is fulfilled by two
     * or more stores, each scoped to its own vendor package.
     */
    public function split(Request $request): JsonResponse
    {
        $base = Order::query()
            ->whereHas('vendorOrders', null, '>=', 2)
            ->with(['user', 'items', 'vendorOrders.store']);

        $orders = (clone $base)
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('payment_status'), fn ($q, $s) => $q->where('payment_status', $s))
            ->when($request->input('payment_method'), fn ($q, $s) => $q->where('payment_method', $s))
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('order_number', 'like', "%{$search}%");
                });
            })
            ->when($request->input('date_from'), fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        $active = [OrderStatus::PENDING, OrderStatus::PAYMENT_PENDING, OrderStatus::CONFIRMED, OrderStatus::ACCEPTED, OrderStatus::PROCESSING, OrderStatus::PREPARING, OrderStatus::READY_FOR_PICKUP, OrderStatus::PICKED_UP, OrderStatus::OUT_FOR_DELIVERY];
        $transit = [OrderStatus::PICKED_UP, OrderStatus::OUT_FOR_DELIVERY];
        $attention = [OrderStatus::PAYMENT_PENDING, OrderStatus::FAILED, OrderStatus::CANCELLED, OrderStatus::RETURNED, OrderStatus::REFUNDED];
        $values = fn (array $cases) => array_map(fn (OrderStatus $c) => $c->value, $cases);

        $summary = [
            'total' => (clone $base)->count(),
            'active' => (clone $base)->whereIn('status', $values($active))->count(),
            'transit' => (clone $base)->whereIn('status', $values($transit))->count(),
            'needs_attention' => (clone $base)->whereIn('status', $values($attention))->count(),
            'gmv' => number_format((float) (clone $base)->sum('grand_total'), 2, '.', ''),
            'avg_packages' => round((float) (clone $base)->withCount('vendorOrders')->get()->avg('vendor_orders_count'), 2),
        ];

        return Response::success(
            AdminOrderResource::collection($orders),
            'Split orders retrieved.',
            [
                'pagination' => [
                    'total' => $orders->total(),
                    'per_page' => $orders->perPage(),
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                ],
                'summary' => $summary,
            ]
        );
    }

    public function show(string $orderId): JsonResponse
    {
        $order = Order::query()
            ->with(['user', 'items', 'vendorOrders.items', 'vendorOrders.store', 'vendorOrders.assignments.deliveryPartner', 'payments', 'shippingAddress'])
            ->where('uuid', $orderId)
            ->orWhere('id', $orderId)
            ->orWhere('order_number', $orderId)
            ->firstOrFail();

        return Response::success(new AdminOrderResource($order), 'Order retrieved.');
    }

    public function returns(Request $request): JsonResponse
    {
        $returns = ReturnRequest::query()
            ->with(['user', 'order', 'vendorOrder', 'orderItem', 'store'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->integer('per_page', 20));

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
        $return = ReturnRequest::where('uuid', $returnId)->orWhere('id', $returnId)->firstOrFail();
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

        $return = ReturnRequest::where('uuid', $returnId)->orWhere('id', $returnId)->firstOrFail();
        $return->status = ReturnStatus::REJECTED;
        $return->reviewed_by = $request->user()->id;
        $return->reviewed_at = now();
        $return->review_notes = $request->input('reason');
        $return->save();

        return Response::success($return, 'Return request rejected.');
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
