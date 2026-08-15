<?php

namespace App\Modules\Cart\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CartItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'string', 'exists:products,uuid'],
            'variant_id' => ['nullable', 'string', 'exists:product_variants,uuid'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:999'],
        ];
    }
}
