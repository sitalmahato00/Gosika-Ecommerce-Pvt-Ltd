<?php

namespace App\Modules\Catalog\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BrandRequestCreateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'brand_id' => ['nullable', 'string', 'exists:brands,uuid'],
            'brand_name' => ['required_without:brand_id', 'string', 'max:150'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
