<?php

namespace App\Modules\Identity\Infrastructure\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Application\Services\NotificationDispatcher;
use Illuminate\Support\Facades\Log;

class IdentityNotificationService
{
    public function __construct(
        protected NotificationDispatcher $dispatcher,
    ) {
    }

    public function sendEmailVerification(User $user): void
    {
        $code = (string) random_int(100000, 999999);
        cache(['email_verify:'.$user->email => hash('sha256', $code)], now()->addHour());

        Log::channel('notification')->info('Email verification OTP generated', [
            'user' => $user->uuid,
            'email' => $user->email,
            'code' => $code,
        ]);

        $this->dispatcher->emailVerificationCode($user, $code);
    }

    public function sendPasswordResetLink(User $user, string $token): void
    {
        $this->dispatcher->passwordResetLink($user, $token);
    }

    public function sendPhoneOtp(User $user, string $code): void
    {
        Log::channel('notification')->info('Phone OTP (delivered via SMS gateway log)', [
            'user' => $user->uuid,
            'phone' => $user->phone,
            'code' => $code,
        ]);
    }
}