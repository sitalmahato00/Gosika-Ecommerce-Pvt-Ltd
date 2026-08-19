<?php

namespace App\Modules\Payment\Application\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderStatusHistory;
use App\Modules\Payment\Domain\Contracts\PaymentProviderContract;
use App\Modules\Payment\Domain\Exceptions\PaymentProviderException;
use App\Modules\Payment\Infrastructure\Models\Payment;
use App\Modules\Payment\Infrastructure\Models\PaymentAttempt;
use App\Modules\Payment\Infrastructure\Models\PaymentStatusHistory;
use App\Modules\Payment\Infrastructure\Services\EsewaProvider;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Enums\PaymentStatus;
use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    /** @var array<string, PaymentProviderContract> */
    protected array $providers = [];

    public function setProvider(string $method, PaymentProviderContract $provider): self
    {
        $this->providers[$method] = $provider;

        return $this;
    }

    public function provider(string $method): ?PaymentProviderContract
    {
        return $this->providers[$method] ?? null;
    }

    public function forUser(User $user, string $uuid): ?Payment
    {
        return Payment::query()->forUser($user->id)->where('uuid', $uuid)->first();
    }

    public function latestForOrder(Order $order): ?Payment
    {
        return Payment::query()->forOrder($order->id)->orderByDesc('id')->first();
    }

    public function initiate(Order $order, User $user, string $method, array $options = []): Payment
    {
        if ($order->payment_status->value === OrderPaymentStatus::PAID->value) {
            throw new PaymentProviderException('Order has already been paid.', 422);
        }

        $provider = $this->provider($method);

        $payment = DB::transaction(function () use ($order, $user, $method, $provider) {
            $payment = new Payment();
            $payment->payment_number = ReferenceNumber::unique('PAY');
            $payment->order_id = $order->id;
            $payment->user_id = $user->id;
            $payment->amount = (float) $order->grand_total;
            $payment->currency = $order->currency ?? 'NPR';
            $payment->method = $method;
            $payment->provider = $provider?->name() ?? $method;
            $payment->status = PaymentStatus::INITIATED;
            $payment->payer_name = $user->name;
            $payment->payer_email = $user->email;
            $payment->initiated_at = now();
            $payment->expires_at = now()->addMinutes((int) config('services.khalti.expiry_minutes', 60));
            $payment->save();

            PaymentStatusHistory::create([
                'payment_id' => $payment->id,
                'from_status' => null,
                'to_status' => PaymentStatus::INITIATED->value,
                'reason' => 'Payment initiated.',
                'actor_user_id' => $user->id,
            ]);

            return $payment;
        });

        if ($method === PaymentMethod::KHALTI->value) {
            if (! $provider) {
                $this->fail($payment, PaymentStatus::FAILED, 'Khalti payment is not configured.', $user->id);

                throw new PaymentProviderException('Khalti payment is not configured.', 422);
            }

            $this->requestKhaltiPayment($payment, $user, $order);
        }

        if ($method === PaymentMethod::ESEWA->value) {
            if (! $provider) {
                $this->fail($payment, PaymentStatus::FAILED, 'eSewa payment is not configured.', $user->id);

                throw new PaymentProviderException('eSewa payment is not configured.', 422);
            }

            $this->requestEsewaPayment($payment, $user, $order, $options);
        }

        return $payment->fresh(['order']);
    }

    protected function requestKhaltiPayment(Payment $payment, User $user, Order $order): void
    {
        $amountPaisa = (int) round((float) $payment->amount * 100);

        $appUrl = config('app.url', 'http://localhost:8000');
        $returnUrl = $appUrl . '/payments/khalti/callback';
        $websiteUrl = $appUrl;

        $payload = [
            'purchase_order_id' => $payment->payment_number,
            'purchase_order_name' => 'GOSIKA Order '.$order->order_number,
            'amount' => $amountPaisa,
            'return_url' => $returnUrl,
            'website_url' => $websiteUrl,
            'customer_info' => [
                'name' => $user->name ?? 'Customer',
                'email' => $user->email,
                'phone' => $user->phone ?? '',
            ],
        ];

        $attempt = PaymentAttempt::create([
            'payment_id' => $payment->id,
            'attempt_number' => $payment->attempts()->count() + 1,
            'status' => PaymentStatus::INITIATED->value,
            'request_payload' => $payload,
            'initiated_at' => now(),
        ]);

        try {
            $result = $this->provider(PaymentMethod::KHALTI->value)->initiate($payload);

            $payment->provider_pidx = $result['pidx'] ?? null;
            $payment->provider_response = $result;
            $payment->status = PaymentStatus::PROCESSING;
            $payment->save();

            $attempt->update([
                'status' => PaymentStatus::PROCESSING->value,
                'provider_pidx' => $result['pidx'] ?? null,
                'response_payload' => $result,
                'completed_at' => now(),
            ]);

            $this->recordStatus($payment, PaymentStatus::INITIATED, PaymentStatus::PROCESSING, 'Redirected to Khalti.', $user->id);
        } catch (\Throwable $e) {
            $attempt->update([
                'status' => PaymentStatus::EXCEPTION->value,
                'response_payload' => ['error' => $e->getMessage()],
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            $from = $payment->status;
            $payment->status = PaymentStatus::EXCEPTION;
            $payment->save();

            $this->recordStatus($payment, $from, PaymentStatus::EXCEPTION, 'Provider initiate failed: '.$e->getMessage(), $user->id);

            throw new PaymentProviderException('Unable to initiate payment. Please try again.', 502);
        }
    }

    protected function requestEsewaPayment(Payment $payment, User $user, Order $order, array $options = []): void
    {
        $total = (float) $payment->amount;
        $tax = (float) ($order->tax ?? 0);
        $delivery = (float) ($order->delivery_charge ?? 0);
        $amount = round($total - $tax - $delivery, 2);

        $payload = [
            'amount' => $amount,
            'tax_amount' => $tax,
            'total_amount' => $total,
            'product_service_charge' => 0,
            'product_delivery_charge' => $delivery,
            'transaction_uuid' => $payment->payment_number,
        ];

        if (! empty($options['success_url'])) {
            $payload['success_url'] = (string) $options['success_url'];
        }

        if (! empty($options['failure_url'])) {
            $payload['failure_url'] = (string) $options['failure_url'];
        }

        $attempt = PaymentAttempt::create([
            'payment_id' => $payment->id,
            'attempt_number' => $payment->attempts()->count() + 1,
            'status' => PaymentStatus::INITIATED->value,
            'request_payload' => $payload,
            'initiated_at' => now(),
        ]);

        try {
            $result = $this->provider(PaymentMethod::ESEWA->value)->initiate($payload);

            $payment->provider_transaction_id = $payload['transaction_uuid'];
            $payment->provider_response = $result;
            $payment->status = PaymentStatus::PROCESSING;
            $payment->save();

            $attempt->update([
                'status' => PaymentStatus::PROCESSING->value,
                'response_payload' => $result,
                'completed_at' => now(),
            ]);

            $this->recordStatus($payment, PaymentStatus::INITIATED, PaymentStatus::PROCESSING, 'Redirected to eSewa.', $user->id);
        } catch (\Throwable $e) {
            $attempt->update([
                'status' => PaymentStatus::EXCEPTION->value,
                'response_payload' => ['error' => $e->getMessage()],
                'error_message' => $e->getMessage(),
                'completed_at' => now(),
            ]);

            $from = $payment->status;
            $payment->status = PaymentStatus::EXCEPTION;
            $payment->save();

            $this->recordStatus($payment, $from, PaymentStatus::EXCEPTION, 'Provider initiate failed: '.$e->getMessage(), $user->id);

            throw new PaymentProviderException('Unable to initiate payment. Please try again.', 502);
        }
    }

    public function verifyFromCallback(array $callback): Payment
    {
        $pidx = $callback['pidx'] ?? null;

        if (! $pidx) {
            throw new PaymentProviderException('Invalid payment callback.', 422);
        }

        $payment = Payment::query()->where('provider_pidx', $pidx)->first();

        if (! $payment) {
            throw new PaymentProviderException('Payment reference not found.', 404);
        }

        if ($payment->isPaid()) {
            return $payment;
        }

        $payment->load('order');

        if ($payment->isExpired()) {
            $this->fail($payment, PaymentStatus::EXPIRED, 'Payment link expired.');
        }

        $provider = $this->provider($payment->method);

        if (! $provider) {
            return $payment;
        }

        $result = $provider->lookup($pidx);
        $payment->provider_response = $result;
        $payment->provider_transaction_id = $result['transaction_id'] ?? null;

        $providerStatus = strtolower((string) ($result['status'] ?? ''));

        if ($providerStatus === 'completed') {
            $providerAmount = (int) ($result['total_amount'] ?? 0);
            $expectedAmount = (int) round((float) $payment->amount * 100);

            if ($providerAmount !== $expectedAmount) {
                $from = $payment->status;
                $payment->status = PaymentStatus::EXCEPTION;
                $payment->save();

                $this->recordStatus($payment, $from, PaymentStatus::EXCEPTION, 'Amount mismatch (provider '.$providerAmount.' vs expected '.$expectedAmount.').', $payment->user_id);

                return $payment;
            }

            return $this->markPaid($payment);
        }

        if ($providerStatus === 'pending') {
            $from = $payment->status;
            $payment->status = PaymentStatus::PROCESSING;
            $payment->save();

            $this->recordStatus($payment, $from, PaymentStatus::PROCESSING, 'Payment pending at provider.', $payment->user_id);

            return $payment;
        }

        $from = $payment->status;
        $payment->provider_response = $result;
        $this->fail($payment, PaymentStatus::FAILED, 'Provider status: '.$providerStatus);

        return $payment;
    }

    public function verifyFromEsewaCallback(array $decoded): Payment
    {
        $transactionUuid = trim((string) ($decoded['transaction_uuid'] ?? ''));
        $responseStatus = strtoupper(trim((string) ($decoded['status'] ?? '')));
        $totalAmount = $decoded['total_amount'] ?? null;
        $productCode = $decoded['product_code'] ?? null;
        $signedFieldNames = $decoded['signed_field_names'] ?? '';
        $receivedSignature = $decoded['signature'] ?? '';
        $transactionCode = $decoded['transaction_code'] ?? null;

        \Log::info('ESEWA CALLBACK RECEIVED', [
            'transaction_uuid' => $transactionUuid,
            'total_amount' => $totalAmount,
            'product_code' => $productCode,
            'response_status' => $responseStatus,
            'transaction_code' => $transactionCode,
        ]);

        if ($transactionUuid === '') {
            throw new PaymentProviderException('Invalid eSewa callback: missing transaction_uuid.', 422);
        }

        $requiredFields = ['transaction_code', 'status', 'total_amount', 'transaction_uuid', 'product_code', 'signed_field_names', 'signature'];
        foreach ($requiredFields as $field) {
            if (empty($decoded[$field])) {
                \Log::error('ESEWA CALLBACK MISSING FIELD', ['field' => $field, 'transaction_uuid' => $transactionUuid]);
                throw new PaymentProviderException('Invalid eSewa callback: missing field "'.$field.'".', 422);
            }
        }

        $secret = (string) Setting::get('payment.esewa_secret_key', config('services.esewa.secret_key'));
        $expectedProductCode = (string) Setting::get('payment.esewa_product_code', config('services.esewa.product_code'));

        if ($productCode !== $expectedProductCode) {
            \Log::error('ESEWA PRODUCT CODE MISMATCH', [
                'received' => $productCode,
                'expected' => $expectedProductCode,
            ]);
            throw new PaymentProviderException('eSewa product code mismatch.', 422);
        }

        $signedFields = array_map('trim', explode(',', $signedFieldNames));
        $parts = [];
        foreach ($signedFields as $field) {
            $parts[] = $field.'='.($decoded[$field] ?? '');
        }
        $expectedSignature = EsewaProvider::sign(implode(',', $parts), $secret);

        if (! hash_equals($expectedSignature, (string) $receivedSignature)) {
            \Log::error('ESEWA SIGNATURE INVALID', ['transaction_uuid' => $transactionUuid]);
            throw new PaymentProviderException('eSewa response signature verification failed.', 422);
        }

        \Log::info('SIGNATURE VALID/INVALID', ['transaction_uuid' => $transactionUuid, 'result' => 'VALID']);

        $payment = DB::transaction(function () use ($transactionUuid) {
            $payment = Payment::query()
                ->where('provider_transaction_id', $transactionUuid)
                ->orWhere('payment_number', $transactionUuid)
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                throw new PaymentProviderException('Payment "'.$transactionUuid.'" not found.', 404);
            }

            if ($payment->isPaid()) {
                \Log::info('ESEWA IDEMPOTENCY: Already paid', ['payment_id' => $payment->id, 'transaction_uuid' => $transactionUuid]);
                return $payment;
            }

            return $payment;
        });

        $payment->load('order');

        $providerAmount = (int) round((float) $totalAmount * 100);
        $expectedAmount = (int) round((float) $payment->amount * 100);

        if ($providerAmount !== $expectedAmount) {
            \Log::error('ESEWA AMOUNT MISMATCH', [
                'transaction_uuid' => $transactionUuid,
                'received' => $totalAmount,
                'expected' => $payment->amount,
            ]);

            DB::transaction(function () use ($payment, $transactionCode) {
                $from = $payment->status;
                $payment->status = PaymentStatus::EXCEPTION;
                $payment->provider_transaction_id = $transactionCode ?? $payment->provider_transaction_id;
                $payment->save();
                $this->recordStatus($payment, $from, PaymentStatus::EXCEPTION, 'Amount mismatch from eSewa.', $payment->user_id);
            });

            throw new PaymentProviderException('eSewa amount mismatch. Possible fraud.', 422);
        }

        if ($responseStatus !== 'COMPLETE') {
            if (in_array($responseStatus, ['PENDING', 'AMBIGUOUS'], true)) {
                DB::transaction(function () use ($payment, $responseStatus) {
                    $from = $payment->status;
                    $payment->status = PaymentStatus::PROCESSING;
                    $payment->save();
                    $this->recordStatus($payment, $from, PaymentStatus::PROCESSING, 'eSewa status: '.$responseStatus, $payment->user_id);
                });

                return $payment->fresh(['order']);
            }

            $statusMessages = [
                'NOT_FOUND' => 'Payment session expired at eSewa.',
                'CANCELED' => 'Payment was canceled on eSewa.',
                'FULL_REFUND' => 'Payment was fully refunded by eSewa.',
                'PARTIAL_REFUND' => 'Payment was partially refunded by eSewa.',
            ];

            DB::transaction(function () use ($payment, $responseStatus, $statusMessages) {
                $from = $payment->status;
                $payment->status = PaymentStatus::FAILED;
                $payment->save();
                $this->recordStatus($payment, $from, PaymentStatus::FAILED, 'eSewa status: '.$responseStatus, $payment->user_id);
            });

            $message = $statusMessages[$responseStatus] ?? 'eSewa payment not completed (status: '.$responseStatus.').';
            throw new PaymentProviderException($message, 422);
        }

        $provider = $this->provider($payment->method);
        $statusApiResult = null;

        if ($provider) {
            try {
                $statusApiResult = $provider->lookup($transactionUuid, ['total_amount' => $payment->amount]);
                \Log::info('STATUS API RESULT', [
                    'transaction_uuid' => $transactionUuid,
                    'api_status' => $statusApiResult['status'] ?? 'unknown',
                    'ref_id' => $statusApiResult['ref_id'] ?? null,
                ]);
            } catch (\Throwable $e) {
                \Log::error('ESEWA STATUS API ERROR', [
                    'transaction_uuid' => $transactionUuid,
                    'error' => $e->getMessage(),
                ]);

                if ($responseStatus === 'COMPLETE') {
                    \Log::info('ESEWA FALLBACK: Status API failed but callback status is COMPLETE, marking paid', [
                        'transaction_uuid' => $transactionUuid,
                    ]);
                } else {
                    throw $e;
                }
            }

            if (is_array($statusApiResult)) {
                $apiStatus = strtoupper((string) ($statusApiResult['status'] ?? ''));

                if ($apiStatus !== 'COMPLETE') {
                    \Log::warning('ESEWA STATUS API NOT COMPLETE', [
                        'transaction_uuid' => $transactionUuid,
                        'api_status' => $apiStatus,
                    ]);

                    if (in_array($apiStatus, ['PENDING', 'AMBIGUOUS'], true)) {
                        DB::transaction(function () use ($payment, $apiStatus) {
                            $from = $payment->status;
                            $payment->status = PaymentStatus::PROCESSING;
                            $payment->save();
                            $this->recordStatus($payment, $from, PaymentStatus::PROCESSING, 'eSewa status API: '.$apiStatus, $payment->user_id);
                        });

                        return $payment->fresh(['order']);
                    }

                    if ($apiStatus !== 'COMPLETE') {
                        DB::transaction(function () use ($payment, $apiStatus) {
                            $from = $payment->status;
                            $payment->status = PaymentStatus::FAILED;
                            $payment->save();
                            $this->recordStatus($payment, $from, PaymentStatus::FAILED, 'eSewa status API: '.$apiStatus, $payment->user_id);
                        });

                        throw new PaymentProviderException('eSewa status API returned: '.$apiStatus, 422);
                    }
                }
            }
        }

        \Log::info('ORDER ID', ['payment_id' => $payment->id, 'order_id' => $payment->order_id, 'transaction_uuid' => $transactionUuid]);

        $result = $this->markPaid($payment);

        $providerRefId = $statusApiResult['ref_id'] ?? $transactionCode ?? null;
        if ($providerRefId) {
            $result->provider_transaction_id = $providerRefId;
            $result->save();
        }

        \Log::info('FINAL PAYMENT RESULT', [
            'payment_id' => $result->id,
            'status' => $result->status->value,
            'order_id' => $result->order_id,
            'transaction_uuid' => $transactionUuid,
            'provider_ref_id' => $providerRefId,
        ]);

        return $result->fresh(['order']);
    }

    public function markPaid(Payment $payment): Payment
    {
        return DB::transaction(function () use ($payment) {
            $from = $payment->status;
            $payment->status = PaymentStatus::PAID;
            $payment->verified_at = now();
            $payment->save();

            $this->recordStatus($payment, $from, PaymentStatus::PAID, 'Payment verified.', $payment->user_id);

            $order = $payment->order;

            if ($order && $order->payment_status->value !== OrderPaymentStatus::PAID->value) {
                $order->payment_status = OrderPaymentStatus::PAID;

                if ($order->status->value === OrderStatus::PAYMENT_PENDING->value) {
                    $order->status = OrderStatus::CONFIRMED;
                    $order->confirmed_at = now();

                    OrderStatusHistory::create([
                        'trackable_type' => Order::class,
                        'trackable_id' => $order->id,
                        'from_status' => OrderStatus::PAYMENT_PENDING->value,
                        'to_status' => OrderStatus::CONFIRMED->value,
                        'reason' => 'Payment confirmed.',
                        'actor_user_id' => $payment->user_id,
                    ]);
                }

                $order->save();
            }

            return $payment->fresh(['order']);
        });
    }

    public function markCodCollected(Order $order): Payment
    {
        $payment = $this->latestForOrder($order);

        if (! $payment) {
            $payment = Payment::query()->create([
                'payment_number' => ReferenceNumber::unique('PAY'),
                'order_id' => $order->id,
                'user_id' => $order->user_id,
                'amount' => (float) $order->grand_total,
                'currency' => $order->currency ?? 'NPR',
                'method' => PaymentMethod::COD->value,
                'provider' => 'cod',
                'status' => PaymentStatus::PAID,
                'initiated_at' => now(),
                'verified_at' => now(),
            ]);
        }

        if (! $payment->isPaid()) {
            $this->markPaid($payment);
        }

        return $payment;
    }

    public function cancel(Payment $payment, ?string $reason = null): Payment
    {
        return DB::transaction(function () use ($payment, $reason) {
            $this->fail($payment, PaymentStatus::CANCELLED, $reason ?? 'Payment cancelled.');

            return $payment->fresh(['order']);
        });
    }

    public function expireOverdue(): int
    {
        $expired = Payment::query()
            ->pending()
            ->where('expires_at', '<', now())
            ->get();

        foreach ($expired as $payment) {
            $this->fail($payment, PaymentStatus::EXPIRED, 'Payment link expired.');
        }

        return $expired->count();
    }

    protected function fail(Payment $payment, PaymentStatus $status, string $reason): void
    {
        $from = $payment->status;
        $payment->status = $status;
        $payment->save();

        $this->recordStatus($payment, $from, $status, $reason, $payment->user_id);
    }

    protected function recordStatus(Payment $payment, PaymentStatus $from, PaymentStatus $to, string $reason, ?int $actorUserId): void
    {
        PaymentStatusHistory::create([
            'payment_id' => $payment->id,
            'from_status' => $from->value,
            'to_status' => $to->value,
            'reason' => $reason,
            'actor_user_id' => $actorUserId,
        ]);
    }
}
