<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Identity\Infrastructure\Models\User;

class PasswordResetMail extends BrandedMail
{
    public function __construct(
        public User $user,
        public string $resetUrl,
    ) {
    }

    public function build(): static
    {
        return $this
            ->subject('Reset your password')
            ->sendBranded('mail.emails.password-reset', [
                'user' => $this->user,
                'resetUrl' => $this->resetUrl,
            ]);
    }
}