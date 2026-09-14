<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Marketing\Application\Services\MailBrand;
use Illuminate\Mail\Mailable;

abstract class BrandedMail extends Mailable
{
    public function sendBranded(string $view, array $data = []): static
    {
        $this->view($view, $data);
        $this->with(['brand' => MailBrand::all()]);
        $this->withSymfonyMessage(function ($message) {
            $brand = MailBrand::all();
            $message->getHeaders()->addTextHeader('X-Gosika-Brand', $brand['brand_name']);
        });

        return $this;
    }
}