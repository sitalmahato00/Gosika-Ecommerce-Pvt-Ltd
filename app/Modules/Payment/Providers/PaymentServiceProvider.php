<?php

namespace App\Modules\Payment\Providers;

use App\Modules\Payment\Application\Services\PaymentService;
use App\Modules\Payment\Domain\Contracts\PaymentProviderContract;
use App\Modules\Payment\Infrastructure\Services\KhaltiProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentService::class, function ($app) {
            $service = new PaymentService();

            $baseUrl = (string) config('services.khalti.base_url', 'https://dev.khalti.com');
            $secretKey = (string) config('services.khalti.secret_key', '');

            if ($secretKey !== '') {
                $provider = new KhaltiProvider(
                    $baseUrl,
                    $secretKey,
                    (string) config('services.khalti.return_url', ''),
                    (string) config('services.khalti.website_url', '')
                );
                $service->setProvider($provider);
            }

            return $service;
        });

        $this->app->bind(PaymentProviderContract::class, KhaltiProvider::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
