<?php

namespace App\Modules\Wallet\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GenerateSettlementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vendor_id' => ['required', 'string', 'exists:vendors,uuid'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
        ];
    }
}
