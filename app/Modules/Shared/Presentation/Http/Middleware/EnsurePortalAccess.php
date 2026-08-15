<?php

namespace App\Modules\Shared\Presentation\Http\Middleware;

use App\Modules\Identity\Domain\Roles;
use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\Exceptions\UnauthorizedException;

class EnsurePortalAccess
{
    public function handle(Request $request, Closure $next, string $portal)
    {
        $user = $request->user();

        if (! $user) {
            throw UnauthorizedException::notLoggedIn();
        }

        $allowed = match ($portal) {
            'admin' => $user->hasRole(Roles::SUPER_ADMIN),
            'vendor' => $user->hasRole(Roles::VENDOR_ADMIN) || $user->vendor !== null,
            'delivery' => $user->hasRole(Roles::DELIVERY_PARTNER) || $user->deliveryPartner !== null,
            default => false,
        };

        if (! $allowed) {
            throw UnauthorizedException::forRoles([$portal]);
        }

        return $next($request);
    }
}
