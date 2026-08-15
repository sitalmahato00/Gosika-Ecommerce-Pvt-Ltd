<?php

namespace App\Modules\Vendor\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bank_name' => ['required', 'string', 'max:120'],
            'branch_name' => ['nullable', 'string', 'max:120'],
            'account_name' => ['required', 'string', 'max:180'],
            'account_number' => ['required', 'string', 'max:60'],
            'account_type' => ['nullable', 'string', 'in:savings,current,other'],
        ];
    }
}
