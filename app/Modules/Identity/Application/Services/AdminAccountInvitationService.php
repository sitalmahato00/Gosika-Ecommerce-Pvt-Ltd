<?php

namespace App\Modules\Identity\Application\Services;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketing\Application\Services\NotificationDispatcher;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminAccountInvitationService
{
    private const INVITATION_KEY = 'admin_account_invitation';

    public function __construct(
        protected NotificationDispatcher $notifications,
    ) {
    }

    public function send(User $user, string $accountType): bool
    {
        $token = Str::random(64);
        $expiresAt = now()->addHours(24);
        $meta = (array) $user->meta;
        $meta[self::INVITATION_KEY] = [
            'token_hash' => hash('sha256', $token),
            'expires_at' => $expiresAt->toISOString(),
        ];

        $user->forceFill(['meta' => $meta])->save();

        $url = rtrim((string) config('app.frontend_url'), '/').'/set-password?'.http_build_query([
            'email' => $user->email,
            'token' => $token,
        ]);

        return $this->notifications->adminAccountInvitation($user, $url, $accountType);
    }

    public function complete(string $email, string $token, string $password): User
    {
        return DB::transaction(function () use ($email, $token, $password): User {
            $user = User::query()
                ->whereRaw('LOWER(email) = ?', [Str::lower(trim($email))])
                ->lockForUpdate()
                ->first();

            $invitation = data_get($user?->meta, self::INVITATION_KEY);
            if (! $user || ! is_array($invitation)) {
                throw new DomainException('This invitation link is invalid or has already been used.', 422);
            }

            if (
                empty($invitation['expires_at'])
                || Carbon::parse($invitation['expires_at'])->isPast()
            ) {
                throw new DomainException('This invitation link has expired. Ask an administrator to send a new one.', 422);
            }

            if (
                empty($invitation['token_hash'])
                || ! hash_equals($invitation['token_hash'], hash('sha256', $token))
            ) {
                throw new DomainException('This invitation link is invalid or has already been used.', 422);
            }

            $meta = (array) $user->meta;
            unset($meta[self::INVITATION_KEY]);

            $user->forceFill([
                'password' => Hash::make($password),
                'email_verified_at' => $user->email_verified_at ?? now(),
                'meta' => $meta,
            ])->save();
            $user->tokens()->delete();

            return $user->load('roles');
        });
    }
}
