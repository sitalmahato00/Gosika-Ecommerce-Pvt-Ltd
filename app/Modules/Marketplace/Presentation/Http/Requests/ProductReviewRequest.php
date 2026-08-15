<?php

namespace App\Modules\Marketplace\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:200'],
            'body' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
