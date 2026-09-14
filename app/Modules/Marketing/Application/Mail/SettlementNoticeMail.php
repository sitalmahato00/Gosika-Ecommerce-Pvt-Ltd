<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use App\Modules\Wallet\Infrastructure\Models\Settlement;
use Illuminate\Support\Str;

class SettlementNoticeMail extends BrandedMail
{
    public function __construct(
        public Settlement $settlement,
        public string $event,
    ) {
    }

    public function build(): static
    {
        $settlement = $this->settlement->loadMissing('vendor');

        $eventHeadline = match ($this->event) {
            'eligible' => 'Settlement '.$settlement->settlement_number.' is ready',
            'held' => 'Settlement '.$settlement->settlement_number.' placed on hold',
            'released' => 'Settlement '.$settlement->settlement_number.' released',
            'distributed' => 'Settlement '.$settlement->settlement_number.' paid out',
            'paid' => 'Settlement '.$settlement->settlement_number.' completed',
            default => 'Settlement '.$settlement->settlement_number.' update',
        };

        return $this
            ->subject($eventHeadline)
            ->sendBranded('mail.emails.settlement-notice', [
                'settlement' => $settlement,
                'event' => $this->event,
                'eventHeadline' => $eventHeadline,
                'statusLabel' => Str::title(str_replace('_', ' ', (string) $settlement->status?->value)),
                'gross' => MailBrand::money((float) $settlement->gross_sales),
                'commission' => MailBrand::money((float) $settlement->commission_total),
                'refunds' => MailBrand::money((float) $settlement->refunds_total),
                'adjustments' => MailBrand::money((float) $settlement->adjustments_total),
                'netPayable' => MailBrand::money((float) $settlement->net_payable),
                'holdReason' => $settlement->hold_reason,
                'settlementUrl' => MailBrand::url('vendor/settlements'),
            ]);
    }
}