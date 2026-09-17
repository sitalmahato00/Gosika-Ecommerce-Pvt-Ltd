<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Identity\Infrastructure\Models\User;

class PasswordResetOtpMail extends BrandedMail
{
    public function __construct(
        public User $user,
        public string $code,
    ) {
    }

    public function build(): static
    {
        return $this
            ->subject('Reset your password')
            ->sendBranded('mail.emails.password-otp', [
                'user' => $this->user,
                'code' => $this->code,
            ]);
    }
}