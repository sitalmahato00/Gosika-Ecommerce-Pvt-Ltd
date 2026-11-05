<?php

namespace App\Modules\Order\Presentation\Http\Controllers;

use App\Modules\Checkout\Application\Services\CheckoutService;
use App\Modules\Order\Application\Services\OrderService;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Presentation\Http\Requests\CancelOrderRequest;
use App\Modules\Order\Presentation\Http\Requests\PlaceOrderRequest;
use App\Modules\Order\Presentation\Resources\OrderResource;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Filters\ListingDateRange;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected CheckoutService $checkoutService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
            'search' => ['nullable', 'string', 'max:120'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $query = Order::query()
            ->where('user_id', $request->user()->id)
            ->withSum(['refunds as refunded_amount' => fn ($query) => $query->where('status', 'refunded')], 'amount')
            ->with([
                'items.product',
                'items.variant',
                'items.returnRequests',
                'items.vendorOrder',
                'vendorOrders' => fn ($query) => $query
                    ->withSum(['refunds as refunded_amount' => fn ($refunds) => $refunds->where('status', 'refunded')], 'amount')
                    ->with('assignments'),
            ])
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('order_number', 'like', '%'.$search.'%')
                        ->orWhereHas('items', fn ($items) => $items->where('product_name', 'like', '%'.$search.'%'));
                });
            })
            ->orderByDesc('placed_at')
            ->orderByDesc('id');

        ListingDateRange::apply($query, $request, 'placed_at');

        $orders = $query->paginate((int) ($filters['per_page'] ?? 15))->withQueryString();

        return Response::success(
            OrderResource::collection($orders),
            'Orders retrieved.',
            ['pagination' => [
                'total' => $orders->total(),
                'per_page' => $orders->perPage(),
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
            ]]
        );
    }

    public function store(PlaceOrderRequest $request): JsonResponse
    {
        $session = $this->checkoutService->pendingFor(request()->user(), $request->input('checkout_session_id'));

        if (! $session) {
            return Response::error('Checkout session not found.', [], 404);
        }

        try {
            $order = $this->orderService->placeOrder(request()->user(), $session, $request->input('customer_notes'));

            return Response::created(new OrderResource($order), 'Order placed.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function show(Order $order): JsonResponse
    {
        $found = $this->orderService->findFor(request()->user(), $order->uuid);

        if (! $found) {
            return Response::error('Order not found.', [], 404);
        }

        return Response::success(new OrderResource($found), 'Order retrieved.');
    }

    public function cancel(CancelOrderRequest $request, Order $order): JsonResponse
    {
        $found = $this->orderService->findFor(request()->user(), $order->uuid);

        if (! $found) {
            return Response::error('Order not found.', [], 404);
        }

        try {
            $order = $this->orderService->cancel(request()->user(), $found, $request->formattedReason());

            return Response::success(new OrderResource($order), 'Order cancelled.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }
}
