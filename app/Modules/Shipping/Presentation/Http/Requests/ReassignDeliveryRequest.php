<?php

namespace App\Modules\Shipping\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReassignDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'delivery_partner_id' => ['required'],
            'reason' => ['required', 'string', 'max:500'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'cod_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'A reassignment reason is required.',
        ];
    }
}
