<?php

namespace App\Modules\Cart\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CartQuantityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:0', 'max:999'],
        ];
    }
}
