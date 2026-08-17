<?php

namespace App\Modules\Customer\Presentation\Http\Controllers;

use App\Modules\Customer\Application\Services\CustomerService;
use App\Modules\Customer\Presentation\Http\Requests\CustomerProfileUpdateRequest;
use App\Modules\Customer\Presentation\Resources\CustomerProfileResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class CustomerProfileController extends Controller
{
    public function __construct(protected CustomerService $customerService)
    {
    }

    public function show(): JsonResponse
    {
        $user = request()->user();
        $profile = $this->customerService->getOrCreateProfile($user);
        $profile->load(['user', 'defaultShippingAddress', 'defaultBillingAddress']);

        return Response::success(new CustomerProfileResource($profile), 'Profile retrieved.');
    }

    public function update(CustomerProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        $profile = $this->customerService->updateProfile($user, $request->validated());
        $profile->load(['user', 'defaultShippingAddress', 'defaultBillingAddress']);

        return Response::success(new CustomerProfileResource($profile), 'Profile updated.');
    }

    public function updatePassword(\Illuminate\Http\Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($data['current_password'], $user->password)) {
            return Response::error('Current password does not match our records.', 422);
        }

        $user->password = \Illuminate\Support\Facades\Hash::make($data['password']);
        $user->save();

        return Response::success(null, 'Password updated successfully.');
    }

    public function uploadAvatar(\Illuminate\Http\Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        $user = $request->user();
        $path = $request->file('avatar')->store('avatars', 'public');
        $user->avatar = $path;
        $user->save();

        return Response::success([
            'avatar' => '/storage/' . $path,
        ], 'Avatar uploaded successfully.');
    }
}
