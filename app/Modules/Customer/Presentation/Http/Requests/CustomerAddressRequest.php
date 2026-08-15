<?php

namespace App\Modules\Customer\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'address_type' => ['required', 'string', Rule::in(['shipping', 'billing'])],
            'label' => ['nullable', 'string', 'max:60'],
            'full_name' => ['nullable', 'string', 'max:180'],
            'phone' => ['required', 'string', 'max:20'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'country_id' => ['nullable', 'string', 'exists:countries,uuid'],
            'province_id' => ['nullable', 'string', 'exists:provinces,uuid'],
            'district_id' => ['nullable', 'string', 'exists:districts,uuid'],
            'municipality_id' => ['nullable', 'string', 'exists:municipalities,uuid'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'string', 'max:20'],
            'longitude' => ['nullable', 'string', 'max:20'],
            'is_default' => ['nullable', 'boolean'],
        ];
    }
}
