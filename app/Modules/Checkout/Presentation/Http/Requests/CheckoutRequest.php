<?php

namespace App\Modules\Checkout\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shipping_address_id' => ['required', 'string', 'exists:customer_addresses,uuid'],
            'billing_address_id' => ['nullable', 'string', 'exists:customer_addresses,uuid'],
            'payment_method' => ['sometimes', 'string', 'in:cod,khalti,esewa'],
        ];
    }
}
