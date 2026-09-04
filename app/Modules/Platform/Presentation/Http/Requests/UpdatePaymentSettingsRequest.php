<?php

namespace App\Modules\Platform\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // General Payment Settings
            'expiration_minutes'         => ['nullable', 'integer', 'min:5', 'max:1440'],
            
            // COD
            'cod_enabled'                => ['nullable', 'boolean'],
            'cod_instructions'           => ['nullable', 'string', 'max:500'],
            'cod_min_amount'             => ['nullable', 'numeric', 'min:0'],
            'cod_max_amount'             => ['nullable', 'numeric', 'min:0'],
            
            // eSewa (Preserved structure)
            'esewa_enabled'              => ['nullable', 'boolean'],
            'esewa_environment'          => ['nullable', 'string', 'in:uat,prod'],
            'esewa_product_code'         => ['nullable', 'string', 'max:100'],
            'esewa_secret_key'           => ['nullable', 'string', 'max:500'],
            
            // Khalti (Preserved structure)
            'khalti_enabled'             => ['nullable', 'boolean'],
            'khalti_environment'         => ['nullable', 'string', 'in:uat,prod'],
            'khalti_secret_key'          => ['nullable', 'string', 'max:500'],
            'khalti_public_key'          => ['nullable', 'string', 'max:500'],
        ];
    }
}
