<?php

namespace App\Modules\Order\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CancelOrderRequest extends FormRequest
{
    public const ALLOWED_REASONS = [
        'Ordered by mistake',
        'Selected the wrong product or quantity',
        'Incorrect delivery address',
        'Found a better price elsewhere',
        'Payment issue',
        'Delivery taking too long',
        'Changed my mind',
        'Other',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'max:255', Rule::in(self::ALLOWED_REASONS)],
            'explanation' => [
                'nullable',
                'string',
                'max:1000',
                Rule::requiredIf(fn () => $this->input('reason') === 'Other'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'reason.required' => 'Please select a reason for cancelling your order.',
            'reason.in' => 'Please select a valid cancellation reason from the list.',
            'explanation.required' => 'Please provide an explanation when selecting "Other" as the cancellation reason.',
        ];
    }

    /**
     * Get the consolidated cancellation reason string to store.
     */
    public function formattedReason(): string
    {
        $reason = (string) $this->input('reason');
        $explanation = trim((string) $this->input('explanation', ''));

        if ($reason === 'Other' && $explanation !== '') {
            return "Other: {$explanation}";
        }

        if ($explanation !== '') {
            return "{$reason} ({$explanation})";
        }

        return $reason;
    }
}
