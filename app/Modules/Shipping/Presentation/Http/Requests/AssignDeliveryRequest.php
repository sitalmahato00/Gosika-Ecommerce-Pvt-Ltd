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
            'vendor_order_id' => ['required', 'string', 'exists:vendor_orders,uuid'],
            'delivery_partner_id' => ['nullable', 'string', 'exists:delivery_partners,uuid'],
            'delivery_fee' => ['nullable', 'numeric', 'min:0'],
            'cod_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
