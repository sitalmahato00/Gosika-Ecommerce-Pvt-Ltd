<?php

namespace App\Modules\Order\Presentation\Http\Requests;

use App\Modules\Shared\Domain\Enums\ReturnRequestType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReturnRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'order_id'             => ['required', 'string'],
            'order_item_id'        => ['required', 'string'],

            // Request type: return_refund | exchange | replacement
            'request_type'         => ['required', Rule::enum(ReturnRequestType::class)],

            // Reason
            'reason_type'          => ['required', 'string', Rule::in([
                'damaged',
                'wrong_item',
                'not_as_described',
                'quality_issue',
                'size_fit',
                'changed_mind',
                'other',
            ])],
            'reason'               => ['required', 'string', 'max:2000'],

            // Quantity
            'quantity'             => ['required', 'integer', 'min:1'],

            // Optional fields
            'preferred_resolution' => ['nullable', 'string', 'max:200'],
            'return_method'        => ['nullable', Rule::in(['pickup', 'drop_off'])],

            // Media (photos/videos)
            'media'                => ['nullable', 'array', 'max:10'],
            'media.*'              => ['file', 'max:51200', 'mimes:jpg,jpeg,png,webp,gif,mp4,mov,avi'],
        ];
    }

    public function messages(): array
    {
        return [
            'media.*.max'   => 'Each file must be under 50 MB.',
            'media.*.mimes' => 'Accepted formats: jpg, png, webp, gif, mp4, mov, avi.',
        ];
    }
}
