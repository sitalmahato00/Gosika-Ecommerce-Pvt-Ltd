<?php

namespace App\Modules\Payment\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InitiatePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'order_id' => ['required', 'string', 'exists:orders,uuid'],
            'method' => ['required', 'string', 'in:khalti,cod'],
        ];
    }
}
