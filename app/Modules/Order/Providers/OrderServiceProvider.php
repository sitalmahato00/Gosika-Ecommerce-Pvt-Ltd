<?php

namespace App\Modules\Order\Providers;

use App\Modules\Order\Application\Services\OrderService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class OrderServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(OrderService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
