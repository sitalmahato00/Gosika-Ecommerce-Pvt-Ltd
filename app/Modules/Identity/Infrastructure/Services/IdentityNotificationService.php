<?php

namespace App\Modules\Identity\Infrastructure\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class IdentityNotificationService
{
    public function sendEmailVerification(User $user): void
    {
        $token = \Illuminate\Support\Str::random(64);
        cache(['email_verify:'.$user->email => hash('sha256', $token)], now()->addHour());

        $url = config('app.url').'/verify-email?email='.$user->email.'&token='.$token;

        Log::channel('notification')->info('Email verification link', [
            'user' => $user->uuid,
            'url' => $url,
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
