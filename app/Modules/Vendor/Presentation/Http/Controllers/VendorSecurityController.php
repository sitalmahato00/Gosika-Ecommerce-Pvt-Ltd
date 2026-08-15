<?php

namespace App\Modules\Vendor\Presentation\Http\Controllers;

use App\Modules\Administration\Infrastructure\Models\AuditLog;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;

class VendorSecurityController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return Response::success([
            'two_factor_enabled' => (bool) ($user->meta['two_factor_enabled'] ?? false),
            'user' => [
                'id' => $user->uuid,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'last_login_at' => $user->last_login_at?->toISOString(),
                'last_login_ip' => $user->last_login_ip,
            ],
            'sessions' => collect($user->tokens()->orderByDesc('last_used_at')->get())->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name ?: 'Mobile',
                'last_active_at' => $t->last_used_at?->toISOString(),
                'created_at' => $t->created_at?->toISOString(),
                'is_current' => $t->id === $user->currentAccessToken()?->id,
            ]),
            'audit_logs' => AuditLog::where('user_id', $user->id)->latest()->limit(10)->get()->map(fn ($l) => [
                'id' => $l->id,
                'event' => $l->action,
                'ip' => $l->ip_address,
                'created_at' => $l->created_at?->toISOString(),
            ]),
        ], 'Security overview retrieved.');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw new DomainException('Current password is incorrect.', 422);
        }

        $user->password = $data['password'];
        $user->save();

        return Response::success(null, 'Password updated.');
    }

    public function revokeSession(Request $request, string $tokenId): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->where('id', (int) $tokenId)->first();

        if (! $token) {
            throw new DomainException('Session not found.', 404);
        }

        if ($token->id === $user->currentAccessToken()?->id) {
            throw new DomainException('Cannot revoke current session.', 422);
        }

        $token->delete();

        return Response::success(null, 'Session revoked.');
    }

    public function revokeAllSessions(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->tokens()->where('id', '!=', $user->currentAccessToken()?->id)->delete();

        return Response::success(null, 'All other sessions revoked.');
    }

    public function updateTwoFactor(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $enabled = (bool) $data['enabled'];
        $user = $request->user();
        $meta = $user->meta ?? [];
        $meta['two_factor_enabled'] = $enabled;
        $user->meta = $meta;
        $user->save();

        return Response::success(['two_factor_enabled' => $enabled], 'Two-factor authentication setting updated.');
    }

    public function updateNotificationSettings(Request $request): JsonResponse
    {
        $settings = $request->validate([
            'sms_orders' => ['nullable', 'boolean'],
            'whatsapp_payouts' => ['nullable', 'boolean'],
            'email_reviews' => ['nullable', 'boolean'],
            'low_stock_push' => ['nullable', 'boolean'],
            'new_orders' => ['nullable', 'boolean'],
            'order_updates' => ['nullable', 'boolean'],
            'low_stock' => ['nullable', 'boolean'],
            'settlements' => ['nullable', 'boolean'],
            'product_approval' => ['nullable', 'boolean'],
            'marketing' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $meta = $user->meta ?? [];
        $meta['notification_preferences'] = array_merge(
            $meta['notification_preferences'] ?? $this->defaultNotificationPreferences(),
            array_map(fn ($value) => (bool) $value, $settings)
        );
        $user->meta = $meta;
        $user->save();

        return Response::success(['preferences' => $meta['notification_preferences']], 'Notification settings updated.');
    }

    public function notificationSettings(Request $request): JsonResponse
    {
        $preferences = $request->user()->meta['notification_preferences'] ?? $this->defaultNotificationPreferences();

        return Response::success(['preferences' => $preferences], 'Notification settings retrieved.');
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access security settings.', 403);
        }

        return $vendor;
    }

    protected function defaultNotificationPreferences(): array
    {
        return [
            'sms_orders' => true,
            'whatsapp_payouts' => true,
            'email_reviews' => true,
            'low_stock_push' => true,
            'new_orders' => true,
            'order_updates' => true,
            'low_stock' => true,
            'settlements' => true,
            'product_approval' => true,
            'marketing' => true,
        ];
    }
}
