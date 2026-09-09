<?php

namespace App\Modules\Marketplace\Presentation\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PublicStoreResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reviews = $this->reviews ?? collect();
        $productCount = $this->products_count ?? 0;
        $address = $this->whenLoaded('addresses') && $this->addresses->isNotEmpty() ? $this->addresses->first() : null;

        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'logo' => $this->media($this->logo),
            'banner' => $this->media($this->banner),
            'description' => $this->description,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'product_count' => $productCount,
            'rating_avg' => $reviews->isNotEmpty() ? round($reviews->avg('rating'), 1) : null,
            'rating_count' => $reviews->count(),
            'location' => $address?->address_line_1,
            'address' => $address ? [
                'address_type' => $address->address_type,
                'address_line_1' => $address->address_line_1,
                'address_line_2' => $address->address_line_2,
                'postal_code' => $address->postal_code,
                'landmark' => $address->landmark,
            ] : null,
            'operating_hours' => $this->whenLoaded('operatingHours', fn () => $this->operatingHours
                ->sortBy('day_of_week')
                ->values()
                ->map(fn ($h) => [
                    'day_of_week' => $h->day_of_week,
                    'opens_at' => $h->opens_at,
                    'closes_at' => $h->closes_at,
                    'is_closed' => (bool) $h->is_closed,
                ])),
            'verified' => true,
            'member_since' => $this->created_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }

    protected function media(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (Str::startsWith($path, ['http://', 'https://', 'data:'])) {
            return $path;
        }

        return url('/storage/'.ltrim($path, '/'));
    }
}