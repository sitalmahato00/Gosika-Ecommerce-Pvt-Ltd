<?php

namespace App\Modules\Payment\Infrastructure\Services;

use App\Modules\Payment\Domain\Contracts\PaymentProviderContract;
use App\Modules\Payment\Domain\Exceptions\PaymentProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class KhaltiProvider implements PaymentProviderContract
{
    public function __construct(
        protected string $baseUrl,
        protected string $secretKey,
        protected string $returnUrl,
        protected string $websiteUrl
    ) {
    }

    public function name(): string
    {
        return 'khalti';
    }

    public function initiate(array $payload): array
    {
        $response = Http::withHeaders(['Authorization' => 'Key '.$this->secretKey])
            ->timeout(20)
            ->post($this->endpoint('/epayment/initiate/'), $payload);

        return $this->decode($response, 'initiate');
    }

    public function lookup(string $pidx, ?array $params = null): array
    {
        $response = Http::withHeaders(['Authorization' => 'Key '.$this->secretKey])
            ->timeout(20)
            ->post($this->endpoint('/epayment/lookup/'), ['pidx' => $pidx]);

        return $this->decode($response, 'lookup');
    }

    protected function endpoint(string $path): string
    {
        return rtrim($this->baseUrl, '/').$path;
    }

    protected function decode(Response $response, string $action): array
    {
        if ($response->clientError() || $response->serverError()) {
            throw new PaymentProviderException(
                'Khalti '.$action.' failed (HTTP '.$response->status().'): '.$response->body(),
                $response->status()
            );
        }

        $data = $response->json();

        if (! is_array($data)) {
            throw new PaymentProviderException('Khalti '.$action.' returned an invalid response.', 502);
        }

        return $data;
    }
}
