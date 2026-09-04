<?php

namespace App\Modules\Platform\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShippingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shipping_enabled'          => ['nullable', 'boolean'],
            'default_provider'          => ['nullable', 'string', 'max:50'],
            'calculation_method'        => ['nullable', 'string', 'in:flat_rate,weight_based,distance_based,provider_based'],
            'flat_charge'               => ['nullable', 'numeric', 'min:0'],
            'free_delivery_threshold'   => ['nullable', 'numeric', 'min:0'],
            'max_shipping_fee'          => ['nullable', 'numeric', 'min:0'],
            'fee_responsibility'        => ['nullable', 'string', 'in:customer,vendor,platform,split'],
            
            // COD
            'cod_enabled'               => ['nullable', 'boolean'],
            'cod_fee'                   => ['nullable', 'numeric', 'min:0'],
            'cod_min_amount'            => ['nullable', 'numeric', 'min:0'],
            'cod_max_amount'            => ['nullable', 'numeric', 'min:0'],
            'cod_instructions'          => ['nullable', 'string', 'max:500'],
            
            // Returns & Refunds
            'allow_returns'             => ['nullable', 'boolean'],
            'return_window_days'        => ['nullable', 'integer', 'min:1', 'max:90'],
            'return_shipping_paid_by'   => ['nullable', 'string', 'in:customer,vendor,platform'],
            'auto_refund_on_return'     => ['nullable', 'boolean'],
            'default_refund_method'     => ['nullable', 'string', 'in:original_payment,wallet,manual'],
            'restocking_fee'            => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
