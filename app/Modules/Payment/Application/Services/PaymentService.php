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
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Enums\PaymentStatus;
use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use Illuminate\Support\Facades\DB;

class PaymentService
{
    protected ?PaymentProviderContract $provider = null;

    public function __construct()
    {
    }

    public function setProvider(PaymentProviderContract $provider): self
    {
        $this->provider = $provider;

        return $this;
    }

    public function provider(): ?PaymentProviderContract
    {
        return $this->provider;
    }

    public function forUser(User $user, string $uuid): ?Payment
    {
        return Payment::query()->forUser($user->id)->where('uuid', $uuid)->first();
    }

    public function latestForOrder(Order $order): ?Payment
    {
        return Payment::query()->forOrder($order->id)->orderByDesc('id')->first();
    }

    public function initiate(Order $order, User $user, string $method): Payment
    {
        if ($order->payment_status->value === OrderPaymentStatus::PAID->value) {
            throw new PaymentProviderException('Order has already been paid.', 422);
        }

        $payment = DB::transaction(function () use ($order, $user, $method) {
            $payment = new Payment();
            $payment->payment_number = ReferenceNumber::unique('PAY');
            $payment->order_id = $order->id;
            $payment->user_id = $user->id;
            $payment->amount = (float) $order->grand_total;
            $payment->currency = $order->currency ?? 'NPR';
            $payment->method = $method;
            $payment->provider = $this->provider ? $this->provider->name() : $method;
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
            if (! $this->provider) {
                $this->fail($payment, PaymentStatus::FAILED, 'Khalti payment is not configured.', $user->id);

                throw new PaymentProviderException('Khalti payment is not configured.', 422);
            }

            $this->requestProviderPayment($payment, $user, $order);
        }

        return $payment->fresh(['order']);
    }

    protected function requestProviderPayment(Payment $payment, User $user, Order $order): void
    {
        $amountPaisa = (int) round((float) $payment->amount * 100);

        $payload = [
            'purchase_order_id' => $payment->payment_number,
            'purchase_order_name' => 'GOSIKA Order '.$order->order_number,
            'amount' => $amountPaisa,
            'return_url' => config('services.khalti.return_url'),
            'website_url' => config('services.khalti.website_url'),
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
            $result = $this->provider->initiate($payload);

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

            $this->recordStatus($payment, PaymentStatus::INITIATED, PaymentStatus::PROCESSING, 'Redirected to '.$this->provider->name().'.', $user->id);
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

        if (! $this->provider) {
            return $payment;
        }

        $result = $this->provider->lookup($pidx);
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
