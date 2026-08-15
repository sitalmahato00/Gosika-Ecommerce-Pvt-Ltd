<?php

namespace App\Modules\Wallet\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MarkPayoutPaidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'provider_reference' => ['nullable', 'string', 'max:120'],
            'fee' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
