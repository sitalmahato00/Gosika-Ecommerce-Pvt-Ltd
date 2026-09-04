<?php

namespace App\Modules\Platform\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGeneralSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'platform_name'        => ['nullable', 'string', 'max:120'],
            'tagline'              => ['nullable', 'string', 'max:255'],
            'description'          => ['nullable', 'string', 'max:1000'],
            'platform_url'         => ['nullable', 'url', 'max:255'],
            'support_email'        => ['nullable', 'email', 'max:150'],
            'support_phone'        => ['nullable', 'string', 'max:30'],
            'business_address'     => ['nullable', 'string', 'max:500'],
            'country'              => ['nullable', 'string', 'max:80'],
            'currency'             => ['nullable', 'string', 'in:NPR,USD,INR,EUR,GBP'],
            'currency_symbol'      => ['nullable', 'string', 'max:10'],
            'currency_position'    => ['nullable', 'string', 'in:before,after'],
            'timezone'             => ['nullable', 'string', 'max:80'],
            'date_format'          => ['nullable', 'string', 'max:30'],
            'time_format'          => ['nullable', 'string', 'max:30'],
            'default_language'     => ['nullable', 'string', 'max:10'],
            'maintenance_mode'     => ['nullable', 'boolean'],
            'maintenance_message'  => ['nullable', 'string', 'max:500'],
            'customer_support_url' => ['nullable', 'url', 'max:255'],
            'business_email'       => ['nullable', 'email', 'max:150'],
        ];
    }
}
