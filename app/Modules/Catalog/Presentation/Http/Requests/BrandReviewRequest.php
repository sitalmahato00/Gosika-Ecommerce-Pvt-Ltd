<?php

namespace App\Modules\Catalog\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BrandReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
