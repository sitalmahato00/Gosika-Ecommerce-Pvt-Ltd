<?php

namespace App\Modules\Customer\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CustomerProfileUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'avatar' => ['nullable', 'string'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'preferences' => ['nullable', 'array'],
        ];
    }
}
