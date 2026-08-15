<?php

namespace App\Modules\Payment\Infrastructure\Services;

use App\Modules\Payment\Domain\Contracts\PaymentProviderContract;
use App\Modules\Payment\Domain\Exceptions\PaymentProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class EsewaProvider implements PaymentProviderContract
{
    public function __construct(
        protected string $secretKey,
        protected string $productCode,
        protected string $formUrl,
        protected string $statusUrl,
        protected string $successUrl,
        protected string $failureUrl
    ) {
    }

    public function name(): string
    {
        return 'esewa';
    }

    public function initiate(array $payload): array
    {
        $amount = number_format((float) ($payload['amount'] ?? 0), 2, '.', '');
        $taxAmount = number_format((float) ($payload['tax_amount'] ?? 0), 2, '.', '');
        $serviceCharge = number_format((float) ($payload['product_service_charge'] ?? 0), 2, '.', '');
        $deliveryCharge = number_format((float) ($payload['product_delivery_charge'] ?? 0), 2, '.', '');
        $totalAmount = number_format((float) ($payload['total_amount'] ?? 0), 2, '.', '');
        $transactionUuid = (string) ($payload['transaction_uuid'] ?? '');
        $productCode = (string) ($payload['product_code'] ?? $this->productCode);

        if ($transactionUuid === '' || $productCode === '' || $this->secretKey === '') {
            throw new PaymentProviderException('eSewa payment is not configured.', 422);
        }

        $signedFieldNames = 'total_amount,transaction_uuid,product_code';
        $signedString = 'total_amount='.$totalAmount.',transaction_uuid='.$transactionUuid.',product_code='.$productCode;

        return [
            'action' => $this->formUrl,
            'fields' => [
                'amount' => $amount,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'transaction_uuid' => $transactionUuid,
                'product_code' => $productCode,
                'product_service_charge' => $serviceCharge,
                'product_delivery_charge' => $deliveryCharge,
                'success_url' => (string) ($payload['success_url'] ?? $this->successUrl),
                'failure_url' => (string) ($payload['failure_url'] ?? $this->failureUrl),
                'signed_field_names' => $signedFieldNames,
                'signature' => $this->sign($signedString, $this->secretKey),
            ],
        ];
    }

    public function lookup(string $transactionUuid, ?array $params = null): array
    {
        $totalAmount = number_format((float) ($params['total_amount'] ?? 0), 2, '.', '');

        try {
            $response = Http::timeout(20)->get($this->statusUrl, [
                'product_code' => $this->productCode,
                'total_amount' => $totalAmount,
                'transaction_uuid' => $transactionUuid,
            ]);
        } catch (ConnectionException) {
            throw new PaymentProviderException('eSewa status service is currently unavailable.', 502);
        }

        return $this->decode($response, 'status');
    }

    public static function sign(string $message, string $secret): string
    {
        return base64_encode(hash_hmac('sha256', $message, $secret, true));
    }

    protected function decode(Response $response, string $action): array
    {
        if ($response->clientError() || $response->serverError()) {
            throw new PaymentProviderException(
                'eSewa '.$action.' failed (HTTP '.$response->status().'): '.$response->body(),
                $response->status()
            );
        }

        $data = $response->json();

        if (! is_array($data)) {
            throw new PaymentProviderException('eSewa '.$action.' returned an invalid response.', 502);
        }

        return $data;
    }
}
