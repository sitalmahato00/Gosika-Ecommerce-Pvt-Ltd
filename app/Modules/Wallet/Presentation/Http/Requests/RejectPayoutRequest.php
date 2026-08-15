<?php

namespace App\Modules\Wallet\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectPayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:500'],
        ];
    }
}
