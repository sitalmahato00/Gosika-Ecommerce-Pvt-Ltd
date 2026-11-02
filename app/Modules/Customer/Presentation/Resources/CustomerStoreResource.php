<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerStoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $logo = $this->logo;
        if ($logo && ! str_starts_with($logo, ['http://', 'https://', 'data:'])) {
            $logo = str_starts_with($logo, '/storage/') ? $logo : '/storage/'.ltrim($logo, '/');
        }

        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo' => $this->logo ? $logo : null,
            'description' => $this->description,
            'products_count' => (int) $this->products_count,
        ];
    }
}
