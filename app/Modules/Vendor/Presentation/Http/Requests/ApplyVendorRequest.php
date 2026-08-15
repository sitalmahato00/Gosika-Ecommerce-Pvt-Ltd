<?php

namespace App\Modules\Vendor\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApplyVendorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:180'],
            'business_email' => ['required', 'email', 'max:255', 'unique:vendors,business_email'],
            'business_phone' => ['nullable', 'string', 'max:20'],
            'pan_vat' => ['nullable', 'string', 'max:30'],
            'registration_number' => ['nullable', 'string', 'max:60'],
        ];
    }
}
