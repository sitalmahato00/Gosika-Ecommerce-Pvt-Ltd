<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use Illuminate\Support\Str;

class ReturnClaimMail extends BrandedMail
{
    public function __construct(
        public ReturnRequest $return,
    ) {
    }

    public function build(): static
    {
        $return = $this->return->loadMissing(['order', 'orderItem.product', 'user']);

        return $this
            ->subject('Return '.$return->return_number.' received — next steps')
            ->sendBranded('mail.emails.return-claim', [
                'return' => $return,
                'customerName' => (string) ($return->user?->full_name ?: 'Valued Customer'),
                'reasonLabel' => Str::title(str_replace('_', ' ', (string) $return->reason_type)),
                'orderNumber' => (string) ($return->order?->order_number ?? ''),
                'productName' => (string) ($return->orderItem?->product_name ?? 'Product'),
                'refundAmount' => $return->refund_amount !== null ? MailBrand::money((float) $return->refund_amount) : null,
                'returnsUrl' => MailBrand::url('account/returns'),
            ]);
    }
}