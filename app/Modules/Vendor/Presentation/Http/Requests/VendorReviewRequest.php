<?php

namespace App\Modules\Vendor\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VendorReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
