<?php

namespace App\Modules\Vendor\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KycRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'owner_full_name' => ['required', 'string', 'max:180'],
            'owner_citizenship_number' => ['nullable', 'string', 'max:40'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_phone' => ['nullable', 'string', 'max:20'],
            'business_type' => ['nullable', 'string', 'max:60'],
            'address' => ['nullable', 'string', 'max:255'],
        ];
    }
}
