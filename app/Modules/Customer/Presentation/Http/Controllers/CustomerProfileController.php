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
}
