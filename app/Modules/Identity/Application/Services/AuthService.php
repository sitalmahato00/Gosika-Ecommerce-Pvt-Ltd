<?php

namespace App\Modules\Identity\Application\Services;

use App\Modules\Identity\Application\DataTransferObjects\LoginDTO;
use App\Modules\Identity\Application\DataTransferObjects\RegisterUserDTO;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Identity\Infrastructure\Services\IdentityNotificationService;
use App\Modules\Identity\Infrastructure\Services\OtpService;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthService
{
    public function __construct(
        protected IdentityNotificationService $notifications,
        protected OtpService $otp,
    ) {
    }

    public function register(RegisterUserDTO $dto): User
    {
        return DB::transaction(function () use ($dto) {
            $user = User::create([
                'first_name' => $dto->first_name,
                'last_name' => $dto->last_name,
                'email' => $dto->email,
                'phone' => $dto->phone,
                'password' => $dto->password,
                'status' => UserStatus::PENDING,
            ]);

            $user->assignRole(Roles::CUSTOMER);

            $this->notifications->sendEmailVerification($user);

            if ($user->phone) {
                $code = $this->otp->generate($user->phone);
                $this->notifications->sendPhoneOtp($user, $code);
            }

            return $user;
        });
    }

    public function createToken(User $user, ?string $deviceName = null): string
    {
        return $user->createToken($deviceName ?: 'gosika-token')->plainTextToken;
    }

    public function login(LoginDTO $dto): User
    {
        $user = User::where('email', $dto->identifier)
            ->orWhere('phone', $dto->identifier)
            ->first();

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw new DomainException('Invalid credentials.', 401);
        }

        if (in_array($user->status, [UserStatus::SUSPENDED, UserStatus::BLOCKED], true)) {
            throw new DomainException('Your account has been suspended. Please contact support.', 403);
        }

        $user->forceFill([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ])->save();

        return $user;
    }

    public function logout(User $user, bool $allDevices = false): void
    {
        if ($allDevices) {
            $user->tokens()->delete();
        } else {
            $user->currentAccessToken()?->delete();
        }
    }

    public function verifyEmail(string $email, string $code): User
    {
        $user = User::where('email', $email)->firstOrFail();

        if (! $user->email_verified_at) {
            $expected = cache("email_verify:{$email}");
            if (! $expected || ! hash_equals($expected, hash('sha256', $code))) {
                throw new DomainException('Invalid or expired verification code.', 422);
            }

            $user->forceFill(['email_verified_at' => now()])->save();
            cache()->forget("email_verify:{$email}");
        }

        $this->activateIfVerified($user);

        return $user;
    }

    public function sendPhoneOtp(User $user): void
    {
        if (! $user->phone) {
            throw new DomainException('No phone number on this account.', 422);
        }

        $code = $this->otp->generate($user->phone);
        $this->notifications->sendPhoneOtp($user, $code);
    }

    public function verifyPhone(User $user, string $code): User
    {
        if (! $user->phone) {
            throw new DomainException('No phone number on this account.', 422);
        }

        if (! $this->otp->verify($user->phone, $code)) {
            throw new DomainException('Invalid or expired OTP.', 422);
        }

        $user->forceFill(['phone_verified_at' => now()])->save();

        $this->activateIfVerified($user);

        return $user;
    }

    public function forgotPassword(string $email): string
    {
        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            throw new DomainException('We could not find an account with that email address.', 422);
        }

        $code = (string) random_int(100000, 999999);
        Cache::put($this->resetOtpKey($user->email), [
            'code' => hash('sha256', $code),
            'attempts' => 0,
        ], now()->addMinutes(10));

        Log::channel('notification')->info('Password reset OTP generated', [
            'user' => $user->uuid,
            'email' => $user->email,
            'code' => $code,
        ]);

        $this->notifications->sendPasswordResetOtp($user, $code);

        return 'Password reset code sent.';
    }

    public function resetPassword(array $credentials): void
    {
        $key = $this->resetOtpKey($credentials['email']);
        $entry = Cache::get($key);

        if (! $entry) {
            throw new DomainException('Invalid or expired reset code.', 422);
        }

        if (($entry['attempts'] ?? 0) >= 5) {
            Cache::forget($key);

            throw new DomainException('Too many invalid attempts. Please request a new code.', 422);
        }

        if (! hash_equals($entry['code'], hash('sha256', $credentials['otp']))) {
            $entry['attempts'] = ($entry['attempts'] ?? 0) + 1;
            Cache::put($key, $entry, now()->addMinutes(10));

            throw new DomainException('Invalid verification code.', 422);
        }

        Cache::forget($key);

        $user = User::query()->where('email', $credentials['email'])->firstOrFail();

        $user->forceFill([
            'password' => $credentials['password'],
            'remember_token' => null,
        ])->save();
    }

    private function resetOtpKey(string $email): string
    {
        return 'password_reset_otp:'.Str::lower(trim($email));
    }

    public function activateIfVerified(User $user): void
    {
        if ($user->email_verified_at && (! $user->phone || $user->phone_verified_at)) {
            if ($user->status === UserStatus::PENDING) {
                $user->forceFill(['status' => UserStatus::ACTIVE])->save();
            }
        }
    }
}
