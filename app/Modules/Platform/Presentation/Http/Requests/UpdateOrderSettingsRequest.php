<?php

namespace App\Modules\Platform\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateOrderSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cancellation_window_minutes' => ['required', 'integer', 'min:0', 'max:1440'],
            'vendor_confirmation_deadline_hours' => ['required', 'integer', 'min:1', 'max:168'],
            'auto_confirmation_enabled' => ['required', 'boolean'],
            'auto_confirmation_minutes' => ['required', 'integer', 'min:1', 'max:10080'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $cancellationMins = (int) $this->input('cancellation_window_minutes', 15);
            $deadlineHours = (int) $this->input('vendor_confirmation_deadline_hours', 24);
            $autoMins = (int) $this->input('auto_confirmation_minutes', 30);
            $autoEnabled = (bool) $this->boolean('auto_confirmation_enabled');

            if ($autoEnabled) {
                // Rule 1: Auto-confirmation duration must not be less than customer cancellation window
                if ($autoMins < $cancellationMins) {
                    $v->errors()->add(
                        'auto_confirmation_minutes',
                        "Auto-confirmation duration ({$autoMins} mins) cannot be less than the minimum customer cancellation window ({$cancellationMins} mins)."
                    );
                }

                // Rule 2: Auto-confirmation duration must be less than maximum vendor confirmation deadline
                $deadlineMins = $deadlineHours * 60;
                if ($autoMins >= $deadlineMins) {
                    $v->errors()->add(
                        'auto_confirmation_minutes',
                        "Auto-confirmation duration ({$autoMins} mins) must be strictly less than the vendor confirmation deadline ({$deadlineHours} hours / {$deadlineMins} mins)."
                    );
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'cancellation_window_minutes.required' => 'The minimum customer cancellation window is required.',
            'cancellation_window_minutes.integer' => 'The customer cancellation window must be an integer in minutes.',
            'vendor_confirmation_deadline_hours.required' => 'The maximum vendor confirmation deadline is required.',
            'vendor_confirmation_deadline_hours.integer' => 'The vendor confirmation deadline must be an integer in hours.',
            'auto_confirmation_enabled.required' => 'The automatic confirmation setting is required.',
            'auto_confirmation_minutes.required' => 'The auto-confirmation duration is required.',
        ];
    }
}
