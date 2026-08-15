<?php

namespace App\Modules\Catalog\Providers;

use App\Modules\Catalog\Application\Services\CatalogService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class CatalogServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CatalogService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
