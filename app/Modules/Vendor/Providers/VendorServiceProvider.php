<?php

namespace App\Modules\Vendor\Providers;

use App\Modules\Vendor\Application\Services\VendorOnboardingService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class VendorServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(VendorOnboardingService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
