<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class AdminCustomerResource extends JsonResource
{
    public function toArray($request): array
    {
        $profile = $this->whenLoaded('customerProfile');

        return [
            'id' => $this->uuid,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at,
            'phone_verified_at' => $this->phone_verified_at,
            'created_at' => $this->created_at,
            'gender' => $profile?->gender,
            'date_of_birth' => $profile?->date_of_birth?->toDateString(),
            'orders_count' => (int) ($this->orders_count ?? 0),
            'total_spend' => (float) ($this->total_spend ?? 0),
            'last_order_at' => $this->last_order_at,
            'wallet_balance' => (float) ($this->whenLoaded('customerWallet') ? ($this->customerWallet->balance ?? 0) : 0),
            'addresses_count' => (int) ($this->addresses_count ?? 0),
        ];
    }
}