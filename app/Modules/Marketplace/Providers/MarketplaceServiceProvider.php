<?php

namespace App\Modules\Marketplace\Providers;

use App\Modules\Marketplace\Application\Services\MarketplaceService;
use App\Modules\Marketplace\Application\Services\WishlistService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class MarketplaceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WishlistService::class);
        $this->app->singleton(MarketplaceService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
