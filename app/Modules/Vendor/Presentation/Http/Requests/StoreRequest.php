<?php

namespace App\Modules\Vendor\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200', 'regex:/^[a-z0-9-]+$/', 'unique:stores,slug'],
            'description' => ['nullable', 'string', 'max:5000'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:20'],
            'logo' => ['nullable', 'string', 'max:500'],
            'banner' => ['nullable', 'string', 'max:500'],
            'settings' => ['nullable', 'array'],
            'settings.order_confirmation_mode' => ['nullable', 'string', 'in:manual,automatic'],
            'settings.auto_confirmation_minutes' => ['nullable', 'integer', 'min:15', 'max:1440'],
            'settings.auto_ready_for_pickup' => ['nullable', 'boolean'],
            'settings.estimated_prep_time' => ['nullable', 'string', 'max:120'],
            'settings.pickup_instructions' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
