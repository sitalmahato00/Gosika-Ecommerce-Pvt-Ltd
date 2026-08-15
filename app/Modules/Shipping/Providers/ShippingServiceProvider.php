<?php

namespace App\Modules\Shipping\Providers;

use App\Modules\Shipping\Application\Services\DeliveryService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class ShippingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(DeliveryService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
