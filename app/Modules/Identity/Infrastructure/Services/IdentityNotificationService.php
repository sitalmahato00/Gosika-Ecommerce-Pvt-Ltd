<?php

namespace App\Modules\Identity\Infrastructure\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class IdentityNotificationService
{
    public function sendEmailVerification(User $user): void
    {
        $code = (string) random_int(100000, 999999);
        cache(['email_verify:'.$user->email => hash('sha256', $code)], now()->addHour());

        Log::channel('notification')->info('Email verification OTP', [
            'user' => $user->uuid,
            'email' => $user->email,
            'code' => $code,
        ]);
    }

    public function sendPasswordResetLink(User $user): void
    {
        $url = URL::temporarySignedRoute(
            'password.reset.redirect',
            now()->addMinutes(30),
            ['email' => $user->email]
        );

        Log::channel('notification')->info('Password reset link', [
            'user' => $user->uuid,
            'url' => $url,
        ]);
    }

    public function sendPhoneOtp(User $user, string $code): void
    {
        Log::channel('notification')->info('Phone OTP', [
            'user' => $user->uuid,
            'phone' => $user->phone,
            'code' => $code,
        ]);
    }
}
