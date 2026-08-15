<?php

namespace App\Modules\Shared\Providers;

use App\Modules\Shared\Infrastructure\Services\Money;
use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class SharedServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Money::class);
        $this->app->singleton(ReferenceNumber::class);
    }

    public function boot(): void
    {
        RateLimiter::for('public', fn ($job) => Limit::perMinute(60)->by($job->ip()));
        RateLimiter::for('auth', fn ($job) => Limit::perMinute(120)->by($job->ip()));
        RateLimiter::for('login', fn ($job) => Limit::perMinute(10)->by($job->ip()));
        RateLimiter::for('password', fn ($job) => Limit::perMinutes(15, 5)->by($job->ip()));
        RateLimiter::for('otp', fn ($job) => Limit::perMinutes(10, 5)->by($job->ip()));
        RateLimiter::for('payment', fn ($job) => Limit::perMinute(30)->by($job->ip()));
        RateLimiter::for('admin', fn ($job) => Limit::perMinute(300)->by($job->ip()));
        RateLimiter::for('upload', fn ($job) => Limit::perMinute(20)->by($job->ip()));
    }
}
