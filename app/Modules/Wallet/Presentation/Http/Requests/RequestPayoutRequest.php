<?php

namespace App\Modules\Wallet\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RequestPayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'gt:0'],
            'bank_account_id' => ['nullable', 'string', 'exists:bank_accounts,uuid'],
        ];
    }
}
