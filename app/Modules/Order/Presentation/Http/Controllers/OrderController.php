<?php

namespace App\Modules\Order\Presentation\Http\Controllers;

use App\Modules\Checkout\Application\Services\CheckoutService;
use App\Modules\Order\Application\Services\OrderService;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Presentation\Http\Requests\CancelOrderRequest;
use App\Modules\Order\Presentation\Http\Requests\PlaceOrderRequest;
use App\Modules\Order\Presentation\Resources\OrderResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected CheckoutService $checkoutService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 15), 1), 50);

        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with(['items'])
            ->when($request->filled('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate($perPage);

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
