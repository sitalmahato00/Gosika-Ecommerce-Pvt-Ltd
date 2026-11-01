<?php

namespace App\Modules\Identity\Infrastructure\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Application\Services\NotificationDispatcher;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class IdentityNotificationService
{
    private const EMAIL_VERIFICATION_TTL_SECONDS = 60;

    public function __construct(
        protected NotificationDispatcher $dispatcher,
    ) {
    }

    public function sendEmailVerification(User $user): void
    {
        $code = (string) random_int(100000, 999999);
        $email = Str::lower(trim($user->email));

        Cache::put(
            $this->emailVerificationKey($email),
            hash('sha256', $code),
            now()->addSeconds(self::EMAIL_VERIFICATION_TTL_SECONDS)
        );
        Cache::put($this->emailVerificationIssuedKey($email), true, now()->addDay());

        Log::channel('notification')->info('Email verification OTP generated', [
            'user' => $user->uuid,
            'email' => $user->email,
            'code' => $code,
        ]);

        $this->dispatcher->emailVerificationCode($user, $code);
    }

    public function emailVerificationKey(string $email): string
    {
        return 'email_verify:'.Str::lower(trim($email));
    }

    public function emailVerificationIssuedKey(string $email): string
    {
        return 'email_verify:issued:'.Str::lower(trim($email));
    }

    public function sendPasswordResetOtp(User $user, string $code): void
    {
        $this->dispatcher->passwordResetOtp($user, $code);
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