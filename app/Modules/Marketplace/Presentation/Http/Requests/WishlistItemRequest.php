<?php

namespace App\Modules\Marketplace\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WishlistItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'string', 'exists:products,uuid'],
        ];
    }
}
