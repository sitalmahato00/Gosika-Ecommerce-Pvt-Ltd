<?php

namespace App\Modules\Checkout\Providers;

use App\Modules\Checkout\Application\Services\CheckoutService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class CheckoutServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CheckoutService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
