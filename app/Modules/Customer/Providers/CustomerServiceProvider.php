<?php

namespace App\Modules\Customer\Providers;

use App\Modules\Customer\Application\Services\CustomerService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class CustomerServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CustomerService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
