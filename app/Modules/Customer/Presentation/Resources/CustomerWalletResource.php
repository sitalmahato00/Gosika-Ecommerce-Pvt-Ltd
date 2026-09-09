<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CustomerWalletResource extends JsonResource
{
    public function toArray($request): array
    {
        $user = $this->whenLoaded('user');

        return [
            'id' => $this->uuid,
            'user_id' => $user?->uuid ?? null,
            'customer' => $user ? [
                'id' => $user->uuid,
                'name' => trim(($user->first_name ?? '').' '.($user->last_name ?? '')),
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'status' => $user->status,
            ] : null,
            'balance' => (float) $this->balance,
            'currency' => $this->currency,
            'transactions_total' => (float) ($this->transactions_total ?? 0),
            'transactions_count' => (int) ($this->transactions_count ?? 0),
            'updated_at' => $this->updated_at,
        ];
    }
}