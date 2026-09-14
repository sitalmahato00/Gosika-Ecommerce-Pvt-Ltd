<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Identity\Infrastructure\Models\User;

class EmailVerificationMail extends BrandedMail
{
    public function __construct(
        public User $user,
        public string $code,
    ) {
    }

    public function build(): static
    {
        return $this
            ->subject('Verify your '.$this->brandName().' account')
            ->sendBranded('mail.emails.email-verification', [
                'user' => $this->user,
                'code' => $this->code,
            ]);
    }

    protected function brandName(): string
    {
        return $this->user->first_name ? $this->user->full_name : 'there';
    }
}