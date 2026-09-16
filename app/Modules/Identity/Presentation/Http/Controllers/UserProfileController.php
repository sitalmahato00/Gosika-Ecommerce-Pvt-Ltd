<?php

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Identity\Presentation\Resources\UserResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return Response::success(new UserResource($request->user()->load('roles')), 'Profile retrieved.');
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $firstName = $data['first_name'] ?? null;
        $lastName = $data['last_name'] ?? null;

        if (! $firstName && ! $lastName && isset($data['name'])) {
            $parts = explode(' ', trim($data['name']), 2);
            $firstName = $parts[0] ?? null;
            $lastName = $parts[1] ?? null;
        }

        if ($firstName !== null) {
            $user->first_name = $firstName;
        }
        if ($lastName !== null) {
            $user->last_name = $lastName;
        }

        foreach (['email', 'phone'] as $field) {
            if (array_key_exists($field, $data)) {
                $user->{$field} = empty($data[$field]) ? null : $data[$field];
            }
        }

        if (array_key_exists('address', $data)) {
            $meta = $user->meta ?? [];
            $meta['address'] = $data['address'];
            $user->meta = $meta;
        }

        $user->save();

        if (! empty($data['company_name']) && $user->vendor()->exists()) {
            $user->vendor()->update(['company_name' => $data['company_name']]);
        }

        return Response::success(new UserResource($user->load('roles')), 'Profile updated.');
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return Response::error('Current password does not match our records.', 422);
        }

        $user->forceFill(['password' => $data['password']])->save();

        return Response::success(null, 'Password updated successfully.');
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->forceFill(['avatar' => $path])->save();

        return Response::success([
            'avatar' => '/storage/' . $path,
        ], 'Avatar uploaded successfully.');
    }

    public function updateNotifications(Request $request): JsonResponse
    {
        $data = $request->validate([
            'preferences' => ['nullable', 'array'],
            'email_orders' => ['nullable', 'boolean'],
            'email_vendors' => ['nullable', 'boolean'],
            'email_system' => ['nullable', 'boolean'],
            'push_orders' => ['nullable', 'boolean'],
            'push_vendors' => ['nullable', 'boolean'],
            'push_system' => ['nullable', 'boolean'],
            'email_notifications' => ['nullable', 'boolean'],
            'order_notifications' => ['nullable', 'boolean'],
            'product_notifications' => ['nullable', 'boolean'],
            'payment_notifications' => ['nullable', 'boolean'],
            'marketing_emails' => ['nullable', 'boolean'],
            'delivery_notifications' => ['nullable', 'boolean'],
            'earning_notifications' => ['nullable', 'boolean'],
            'route_notifications' => ['nullable', 'boolean'],
        ]);

        $user = $request->user();
        $meta = $user->meta ?? [];
        $current = $meta['notification_preferences'] ?? [];
        $payload = ! empty($data['preferences']) ? $data['preferences'] : $data;
        unset($payload['preferences']);

        foreach ($payload as $key => $value) {
            $current[$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }

        $meta['notification_preferences'] = $current;
        $user->meta = $meta;
        $user->save();

        return Response::success(['preferences' => $current], 'Notification settings updated.');
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            'preferences' => ['nullable', 'array'],
            'language' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:64'],
            'date_format' => ['nullable', 'string', 'max:16'],
            'items_per_page' => ['nullable', 'integer', 'min:5', 'max:200'],
            'currency' => ['nullable', 'string', 'max:8'],
            'distance_unit' => ['nullable', 'in:km,mi'],
        ]);

        $user = $request->user();
        $meta = $user->meta ?? [];
        $current = $meta['app_preferences'] ?? [];
        $payload = ! empty($data['preferences']) ? $data['preferences'] : $data;
        unset($payload['preferences']);

        $current = array_merge($current, $payload);
        $meta['app_preferences'] = $current;
        $user->meta = $meta;
        $user->save();

        return Response::success(['preferences' => $current], 'Preferences updated.');
    }
}