<?php

namespace App\Modules\Order\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlaceOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'checkout_session_id' => ['required', 'string', 'exists:checkout_sessions,uuid'],
            'customer_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
