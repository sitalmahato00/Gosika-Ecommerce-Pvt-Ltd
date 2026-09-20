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
use App\Modules\Shared\Domain\Enums\PaymentStatus;
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
                $request->input('method', 'khalti'),
                $request->only(['success_url', 'failure_url'])
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

    public function esewaCallback(\Illuminate\Http\Request $request): JsonResponse
    {
        $raw = $request->input('data') ?? $request->input('result');
        $decoded = null;

        if (is_string($raw) && $raw !== '') {
            $jsonStr = base64_decode(trim($raw), true);
            if ($jsonStr === false) {
                $jsonStr = base64_decode(urldecode(trim($raw)), true);
            }
            $decoded = $jsonStr ? json_decode($jsonStr, true) : null;
        }

        if (! is_array($decoded) || empty($decoded['transaction_uuid'])) {
            return Response::error('Invalid or missing eSewa callback data.', [], 422);
        }

        try {
            $payment = $this->paymentService->verifyFromEsewaCallback($decoded);

            return Response::success(new PaymentResource($payment), 'Payment verified.');
        } catch (PaymentProviderException $e) {
            return Response::error($e->getMessage(), [], $e->getCode() ?: 422);
        }
    }

    public function esewaWebCallback(\Illuminate\Http\Request $request)
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $data = $request->query('data');

        if (! is_string($data) || $data === '') {
            return redirect($frontendUrl . '/payments/esewa/callback?status=failure');
        }

        $jsonStr = base64_decode(trim($data), true);
        if ($jsonStr === false) {
            $jsonStr = base64_decode(urldecode(trim($data)), true);
        }
        $decoded = $jsonStr ? json_decode($jsonStr, true) : null;

        if (! is_array($decoded) || empty($decoded['transaction_uuid'])) {
            return redirect($frontendUrl . '/payments/esewa/callback?status=failure');
        }

        try {
            $payment = $this->paymentService->verifyFromEsewaCallback($decoded);
            $orderUuid = $payment->order?->uuid ?? $payment->order_id;

            return redirect($frontendUrl . '/order-success?order_id=' . $orderUuid . '&esewa=1');
        } catch (\Throwable $e) {
            \Log::error('eSewa web callback failed', [
                'error' => $e->getMessage(),
                'transaction_uuid' => $decoded['transaction_uuid'] ?? null,
            ]);

            return redirect($frontendUrl . '/payments/esewa/callback?status=failure');
        }
    }

    public function khaltiWebCallback(\Illuminate\Http\Request $request)
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $status = $request->query('status', '');
        $pidx = $request->query('pidx', '');
        $purchaseOrderId = $request->query('purchase_order_id', '');

        \Log::info('KHALTI CALLBACK RECEIVED', [
            'pidx' => $pidx,
            'status' => $status,
            'purchase_order_id' => $purchaseOrderId,
            'total_amount' => $request->query('total_amount'),
            'transaction_id' => $request->query('transaction_id'),
        ]);

        if ($status === 'User canceled' || $status === '' || $status === 'Expired' || $status === 'failure') {
            return redirect($frontendUrl . '/payments/khalti/callback?status=failure&pidx=' . urlencode($pidx) . '&purchase_order_id=' . urlencode($purchaseOrderId));
        }

        try {
            $payment = $this->paymentService->verifyFromCallback([
                'pidx' => $pidx,
                'status' => $status,
                'transaction_id' => $request->query('transaction_id'),
                'total_amount' => $request->query('total_amount'),
                'purchase_order_id' => $purchaseOrderId,
            ]);

            $orderUuid = $payment->order?->uuid ?? $payment->order_id;

            \Log::info('KHALTI CALLBACK RESULT', [
                'order_id' => $orderUuid,
                'payment_status' => $payment->status,
            ]);

            return redirect($frontendUrl . '/order-success?order_id=' . $orderUuid . '&khalti=1');
        } catch (\Throwable $e) {
            \Log::error('Khalti web callback failed', [
                'error' => $e->getMessage(),
                'pidx' => $pidx,
            ]);

            return redirect($frontendUrl . '/orders');
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

    public function esewaVerifyByOrder(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate(['order_id' => 'required|string']);

        $order = $this->orderService->findFor(request()->user(), $request->input('order_id'));

        if (! $order) {
            return Response::error('Order not found.', [], 404);
        }

        $payment = Payment::query()
            ->forOrder($order->id)
            ->where('method', 'esewa')
            ->whereIn('status', [PaymentStatus::INITIATED, PaymentStatus::PROCESSING])
            ->orderByDesc('id')
            ->first();

        if (! $payment) {
            $paid = Payment::query()
                ->forOrder($order->id)
                ->where('method', 'esewa')
                ->where('status', PaymentStatus::PAID)
                ->first();

            if ($paid) {
                return Response::success([
                    'payment' => new PaymentResource($paid->fresh(['order'])),
                    'order' => new OrderResource($order),
                ], 'Payment already confirmed.');
            }

            return Response::error('No pending eSewa payment found for this order.', [], 404);
        }

        try {
            $payment = $this->paymentService->verifyEsewaOrderStatus($payment);

            return Response::success([
                'payment' => new PaymentResource($payment),
                'order' => new OrderResource($order),
            ], 'Payment verified.');
        } catch (PaymentProviderException $e) {
            return Response::error($e->getMessage(), [], $e->getCode() ?: 422);
        }
    }
}
