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

        // Eager load roles if not already loaded
        if (! $user->relationLoaded('roles')) {
            $user->load('roles');
        }
        
        $roles = $user->roles->pluck('name');

        $allowed = match ($portal) {
            'admin' => ! $roles->contains('customer') && ! $roles->contains('vendor_admin'),
            'vendor' => $roles->contains(Roles::VENDOR_ADMIN) || $roles->contains('vendor_admin') || $roles->contains('vendor') || $user->vendor !== null,
            'delivery' => $roles->contains(Roles::DELIVERY_PARTNER) || $roles->contains('delivery_partner') || $roles->contains('delivery') || $user->deliveryPartner !== null,
            default => false,
        };

        if (! $allowed) {
            throw UnauthorizedException::forRoles([$portal]);
        }

        return $next($request);
    }
}
