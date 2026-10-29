<?php

use App\Modules\Order\Application\Services\OrderConfirmationSchedulerService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('orders:process-confirmations', function (OrderConfirmationSchedulerService $scheduler) {
    $this->info('Starting order confirmations and expirations check...');
    $results = $scheduler->run();
    $this->info("Completed: {$results['auto_confirmed']} order(s) auto-confirmed, {$results['expired_cancelled']} expired order(s) cancelled.");
})->purpose('Process automatic order confirmations and auto-cancel orders past the vendor confirmation deadline.');

Schedule::command('orders:process-confirmations')->everyMinute();
