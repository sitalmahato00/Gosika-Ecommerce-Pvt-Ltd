<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to ensure the user has an admin role.
 * Blocks 'customer' and 'vendor_admin' roles from accessing admin routes.
 * Allows 'super_admin', 'delivery_partner', and any custom admin roles.
 */
class RequireAdminRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (! $user) {
            abort(401, 'Unauthenticated');
        }
        
        // Eager load roles if not already loaded
        if (! $user->relationLoaded('roles')) {
            $user->load('roles');
        }
        
        $roles = $user->roles->pluck('name');
        
        // Block customer and vendor_admin roles
        if ($roles->contains('customer') || $roles->contains('vendor_admin')) {
            abort(403, 'Unauthorized');
        }
        
        return $next($request);
    }
}
