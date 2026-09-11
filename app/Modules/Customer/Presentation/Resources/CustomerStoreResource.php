<?php

namespace App\Modules\Customer\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerStoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo' => $this->logo ? url('/storage/'.$this->logo) : null,
            'description' => $this->description,
            'products_count' => (int) $this->products_count,
        ];
    }
}