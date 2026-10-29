<?php

namespace App\Modules\Shipping\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignDeliveryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vendor_order_id' => ['required'],
            'delivery_partner_id' => ['required'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'cod_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
