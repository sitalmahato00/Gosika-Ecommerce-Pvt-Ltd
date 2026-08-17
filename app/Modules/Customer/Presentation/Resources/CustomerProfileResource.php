<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $this->whenLoaded('user') ? $this->user : $request->user();

        return [
            'id' => $this->uuid,
            'first_name' => $user?->first_name,
            'last_name' => $user?->last_name,
            'full_name' => $user?->full_name,
            'email' => $user?->email,
            'phone' => $user?->phone,
            'avatar' => $user?->avatar ? (str_starts_with($user->avatar, 'http') ? $user->avatar : '/storage/' . $user->avatar) : null,
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'preferences' => $this->preferences,
            'default_shipping_address' => $this->whenLoaded('defaultShippingAddress')
                ? new CustomerAddressResource($this->defaultShippingAddress)
                : null,
            'default_billing_address' => $this->whenLoaded('defaultBillingAddress')
                ? new CustomerAddressResource($this->defaultBillingAddress)
                : null,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
