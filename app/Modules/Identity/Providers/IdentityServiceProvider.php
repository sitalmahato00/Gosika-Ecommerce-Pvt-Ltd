<?php

namespace App\Modules\Identity\Providers;

use App\Modules\Identity\Application\Services\AuthService;
use App\Modules\Identity\Infrastructure\Services\IdentityNotificationService;
use App\Modules\Identity\Infrastructure\Services\OtpService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class IdentityServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(OtpService::class);
        $this->app->singleton(IdentityNotificationService::class);
        $this->app->singleton(AuthService::class);
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/../Routes/api.php');
    }
}
