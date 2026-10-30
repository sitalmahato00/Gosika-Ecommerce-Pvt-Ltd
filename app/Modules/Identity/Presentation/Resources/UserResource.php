<?php

namespace App\Modules\Identity\Presentation\Resources;

use App\Modules\Identity\Domain\Permissions;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => $this->full_name,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar' => $this->avatar ? (str_starts_with($this->avatar, 'http') ? $this->avatar : '/storage/' . ltrim($this->avatar, '/')) : null,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'phone_verified_at' => $this->phone_verified_at?->toISOString(),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'permissions' => $this->whenLoaded('roles', function () {
                // Super admins get all permissions
                if ($this->hasRole('super_admin')) {
                    return Permissions::ALL;
                }
                // Other users get their assigned permissions
                return $this->getAllPermissions()->pluck('name')->toArray();
            }),
            'address' => $this->meta['address'] ?? null,
            'meta' => $this->meta,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
