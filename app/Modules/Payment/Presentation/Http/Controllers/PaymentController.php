<?php

namespace App\Modules\Payment\Presentation\Http\Controllers;

use App\Modules\Order\Application\Services\OrderService;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Presentation\Resources\OrderResource;
use App\Modules\Payment\Application\Services\PaymentService;
use App\Modules\Payment\Domain\Exceptions\PaymentProviderException;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Payment\Presentation\Http\Requests\InitiatePaymentRequest;
use App\Modules\Payment\Presentation\Resources\PaymentResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected OrderService $orderService
    ) {
    }

    public function initiate(InitiatePaymentRequest $request): JsonResponse
    {
        $order = $this->orderService->findFor(request()->user(), $request->input('order_id'));

        if (! $order) {
            return Response::error('Order not found.', [], 404);
        }

        try {
            $payment = $this->paymentService->initiate(
                $order,
                request()->user(),
                $request->input('method', 'khalti')
            );

            return Response::created(new PaymentResource($payment), 'Payment initiated.');
        } catch (PaymentProviderException $e) {
            return Response::error($e->getMessage(), [], 422);
        }
    }

    public function callback(\Illuminate\Http\Request $request): JsonResponse
    {
        try {
            $payment = $this->paymentService->verifyFromCallback($request->only(['pidx', 'status', 'transaction_id', 'total_amount', 'purchase_order_id']));

            return Response::success(new PaymentResource($payment), 'Payment verified.');
        } catch (PaymentProviderException $e) {
            return Response::error($e->getMessage(), [], $e->getCode() ?: 422);
        }
    }

    public function show(Payment $payment): JsonResponse
    {
        $found = $this->paymentService->forUser(request()->user(), $payment->uuid);

        if (! $found) {
            return Response::error('Payment not found.', [], 404);
        }

        return Response::success(new PaymentResource($found), 'Payment retrieved.');
    }

    public function status(Payment $payment): JsonResponse
    {
        $found = $this->paymentService->forUser(request()->user(), $payment->uuid);

        if (! $found) {
            return Response::error('Payment not found.', [], 404);
        }

        $order = $this->orderService->findFor(request()->user(), $found->order?->uuid);

        return Response::success([
            'payment' => new PaymentResource($found),
            'order' => $order ? new OrderResource($order) : null,
        ], 'Payment status retrieved.');
    }
}
