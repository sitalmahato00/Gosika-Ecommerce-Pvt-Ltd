<?php

namespace App\Modules\Payment\Providers;

use App\Modules\Payment\Application\Services\PaymentService;
use App\Modules\Payment\Domain\Contracts\PaymentProviderContract;
use App\Modules\Payment\Infrastructure\Services\EsewaProvider;
use App\Modules\Payment\Infrastructure\Services\KhaltiProvider;
use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentService::class, function ($app) {
            return $this->buildPaymentService();
        });

        $this->app->bind(PaymentProviderContract::class, KhaltiProvider::class);
    }

    protected function buildPaymentService(): PaymentService
    {
        $service = new PaymentService();

        $setting = static function (string $key, mixed $fallback = ''): string {
            $value = Setting::get($key);

            return $value === null || $value === '' ? (string) $fallback : (string) $value;
        };

        $khaltiSecret = $setting('payment.khalti_secret_key', config('services.khalti.secret_key'));
        $khaltiEnvironment = $setting('payment.khalti_environment', 'uat');

        if ($khaltiEnvironment === 'prod') {
            $khaltiBaseUrl = 'https://khalti.com/api/v2';
        } else {
            $khaltiBaseUrl = $setting('payment.khalti_base_url', config('services.khalti.base_url'));
        }

        $appUrl = config('app.url', 'http://localhost:8000');

        if ($khaltiSecret !== '') {
            $service->setProvider('khalti', new KhaltiProvider(
                $khaltiBaseUrl,
                $khaltiSecret,
            ));
        }

        $esewaEnvironment = $setting('payment.esewa_environment', config('services.esewa.environment'));
        $esewaSecret = $setting('payment.esewa_secret_key', config('services.esewa.secret_key'));
        $esewaProductCode = $setting('payment.esewa_product_code', config('services.esewa.product_code'));

        if ($esewaEnvironment === 'prod') {
            $formUrl = 'https://epay.esewa.com.np/api/epay/main/v2/form';
            $statusUrl = 'https://esewa.com.np/api/epay/transaction/status/';
        } else {
            $formUrl = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
            $statusUrl = 'https://rc.esewa.com.np/api/epay/transaction/status/';
        }

        $esewaSuccess = config('app.url', 'http://localhost:8000') . '/payments/esewa/callback';
        $esewaFailure = config('app.url', 'http://localhost:8000') . '/payments/esewa/callback?status=failure';

        if ($esewaSecret !== '') {
            $service->setProvider('esewa', new EsewaProvider(
                $esewaSecret,
                $esewaProductCode,
                $formUrl,
                $statusUrl,
                $esewaSuccess,
                $esewaFailure
            ));
        }

        return $service;
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
