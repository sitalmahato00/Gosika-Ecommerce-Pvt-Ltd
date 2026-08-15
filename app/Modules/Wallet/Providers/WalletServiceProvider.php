<?php

namespace App\Modules\Wallet\Providers;

use App\Modules\Wallet\Application\Services\WalletService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class WalletServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WalletService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
