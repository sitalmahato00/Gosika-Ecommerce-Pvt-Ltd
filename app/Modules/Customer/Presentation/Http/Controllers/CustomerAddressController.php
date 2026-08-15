<?php

namespace App\Modules\Customer\Presentation\Http\Controllers;

use App\Modules\Customer\Application\Services\CustomerService;
use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Customer\Presentation\Http\Requests\CustomerAddressRequest;
use App\Modules\Customer\Presentation\Resources\CustomerAddressResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class CustomerAddressController extends Controller
{
    public function __construct(protected CustomerService $customerService)
    {
    }

    public function index(): JsonResponse
    {
        $addresses = $this->customerService->listAddresses(request()->user());

        return Response::success(CustomerAddressResource::collection($addresses), 'Addresses retrieved.');
    }

    public function store(CustomerAddressRequest $request): JsonResponse
    {
        $address = $this->customerService->createAddress($request->user(), $request->validated());

        return Response::created(new CustomerAddressResource($address), 'Address created.');
    }

    public function show(CustomerAddress $address): JsonResponse
    {
        $found = $this->customerService->findAddress(request()->user(), $address->uuid);

        if (! $found) {
            return Response::error('Address not found.', [], 404);
        }

        return Response::success(new CustomerAddressResource($found), 'Address retrieved.');
    }

    public function update(CustomerAddressRequest $request, CustomerAddress $address): JsonResponse
    {
        $found = $this->customerService->findAddress(request()->user(), $address->uuid);

        if (! $found) {
            return Response::error('Address not found.', [], 404);
        }

        $address = $this->customerService->updateAddress(request()->user(), $found, $request->validated());

        return Response::success(new CustomerAddressResource($address), 'Address updated.');
    }

    public function destroy(CustomerAddress $address): JsonResponse
    {
        $found = $this->customerService->findAddress(request()->user(), $address->uuid);

        if (! $found) {
            return Response::error('Address not found.', [], 404);
        }

        $this->customerService->deleteAddress(request()->user(), $found);

        return Response::noContent('Address deleted.');
    }

    public function setDefault(CustomerAddress $address): JsonResponse
    {
        $found = $this->customerService->findAddress(request()->user(), $address->uuid);

        if (! $found) {
            return Response::error('Address not found.', [], 404);
        }

        $profile = $this->customerService->setDefaultAddress(request()->user(), $found);

        return Response::success(
            [
                'address' => new CustomerAddressResource($found->fresh()),
                'default' => $found->address_type === 'shipping' ? $profile->default_shipping_address_id : $profile->default_billing_address_id,
            ],
            'Default address updated.'
        );
    }
}
