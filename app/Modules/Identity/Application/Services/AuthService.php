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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

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
        $status = Password::broker()->sendResetLink(['email' => $email]);

        return $status === Password::RESET_LINK_SENT
            ? 'Password reset link sent.'
            : throw new DomainException('Unable to send reset link. Please check your email address.', 422);
    }

    public function resetPassword(array $credentials): void
    {
        $status = Password::broker()->reset($credentials, function ($user, $password) {
            $user->forceFill([
                'password' => $password,
                'remember_token' => null,
            ])->save();
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw new DomainException('Unable to reset password. The link may be invalid or expired.', 422);
        }
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
