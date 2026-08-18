<?php

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function redirect(string $provider): RedirectResponse
    {
        $this->validateProvider($provider);

        return Socialite::driver($provider)->stateless()->redirect();
    }

    public function callback(string $provider, Request $request): RedirectResponse
    {
        $this->validateProvider($provider);

        $socialUser = Socialite::driver($provider)->stateless()->user();

        $name = $socialUser->getName() ?? '';
        $parts = array_filter(explode(' ', $name));

        $user = User::firstOrCreate(
            ['provider' => $provider, 'provider_id' => $socialUser->getId()],
            [
                'first_name' => $parts[0] ?? 'User',
                'last_name' => $parts[1] ?? '',
                'email' => $socialUser->getEmail(),
                'avatar' => $socialUser->getAvatar(),
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make(Str::random(32)),
            ]
        );

        if ($user->wasRecentlyCreated) {
            $user->assignRole('customer');
        }

        if (! $user->email_verified_at) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }
        if ($user->status !== 'active') {
            $user->forceFill(['status' => 'active'])->save();
        }

        if (! $user->avatar && $socialUser->getAvatar()) {
            $user->forceFill(['avatar' => $socialUser->getAvatar()])->save();
        }

        $token = $user->createToken('gosika-social-token')->plainTextToken;

        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        return redirect()->away(
            $frontendUrl . '/social-auth?' . http_build_query([
                'token' => $token,
                'name' => $user->name ?? $user->full_name,
                'email' => $user->email,
            ])
        );
    }

    protected function validateProvider(string $provider): void
    {
        if ($provider !== 'google') {
            abort(404);
        }
    }
}
