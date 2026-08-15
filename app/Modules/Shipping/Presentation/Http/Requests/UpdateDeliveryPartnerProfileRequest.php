<?php

namespace App\Modules\Shipping\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDeliveryPartnerProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:180'],
            'email' => ['nullable', 'email', 'max:255'],
            'vehicle_type' => ['nullable', 'string', 'max:40'],
            'vehicle_number' => ['nullable', 'string', 'max:30'],
            'service_areas' => ['nullable', 'array'],
            'service_areas.*' => ['string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
