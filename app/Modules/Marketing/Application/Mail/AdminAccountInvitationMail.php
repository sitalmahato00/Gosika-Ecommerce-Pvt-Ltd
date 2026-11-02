<?php

namespace App\Modules\Marketing\Application\Mail;

use App\Modules\Identity\Infrastructure\Models\User;

class AdminAccountInvitationMail extends BrandedMail
{
    public function __construct(
        public User $user,
        public string $invitationUrl,
        public string $accountType,
    ) {
    }

    public function build(): static
    {
        return $this
            ->subject('Set up your '.$this->accountType.' account')
            ->sendBranded('mail.emails.admin-account-invitation', [
                'user' => $this->user,
                'invitationUrl' => $this->invitationUrl,
                'accountType' => $this->accountType,
            ]);
    }
}
