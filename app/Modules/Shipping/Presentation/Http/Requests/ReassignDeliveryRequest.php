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
            'delivery_partner_id' => ['required', 'string', 'exists:delivery_partners,uuid'],
        ];
    }
}
