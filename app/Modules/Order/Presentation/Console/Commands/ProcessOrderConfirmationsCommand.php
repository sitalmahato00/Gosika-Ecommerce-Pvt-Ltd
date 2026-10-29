<?php

namespace App\Modules\Order\Presentation\Console\Commands;

use App\Modules\Order\Application\Services\OrderConfirmationSchedulerService;
use Illuminate\Console\Command;

class ProcessOrderConfirmationsCommand extends Command
{
    protected $signature = 'orders:process-confirmations';
    protected $description = 'Process automatic order confirmations and auto-cancel orders past the vendor confirmation deadline.';

    public function handle(OrderConfirmationSchedulerService $scheduler): int
    {
        $this->info('Starting order confirmations and expirations check...');

        $results = $scheduler->run();

        $this->info("Completed: {$results['auto_confirmed']} order(s) auto-confirmed, {$results['expired_cancelled']} expired order(s) cancelled.");

        return Command::SUCCESS;
    }
}
