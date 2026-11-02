<?php

namespace App\Modules\Vendor\Presentation\Http\Requests;

use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use Illuminate\Validation\Rule;

class VendorVerificationSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->vendor !== null;
    }

    public function rules(): array
    {
        /** @var Vendor $vendor */
        $vendor = $this->user()->vendor;

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($this->user()->id)],
            'company_name' => ['required', 'string', 'max:200'],
            'business_email' => ['required', 'email', 'max:255', Rule::unique('vendors', 'business_email')->ignore($vendor->id)],
            'business_phone' => ['nullable', 'string', 'max:40'],
            'pan_vat' => ['required', 'string', 'max:60'],
            'registration_number' => ['nullable', 'string', 'max:60'],
            'store_id' => [
                'nullable',
                'uuid',
                Rule::exists('stores', 'uuid')->where('vendor_id', $vendor->id),
            ],
            'store_name' => ['required', 'string', 'max:180'],
            'store_description' => ['required', 'string', 'max:5000'],
            'store_logo' => ['required', 'string', 'max:600'],
            'store_banner' => ['required', 'string', 'max:600'],
            'bank_account_id' => [
                'nullable',
                'uuid',
                Rule::exists('bank_accounts', 'uuid')->where('vendor_id', $vendor->id),
            ],
            'bank_name' => ['required', 'string', 'max:120'],
            'branch_name' => ['nullable', 'string', 'max:120'],
            'account_name' => ['required', 'string', 'max:180'],
            'account_number' => ['required', 'string', 'max:60'],
            'account_type' => ['required', 'string', Rule::in(['savings', 'current', 'other'])],
            'owner_full_name' => ['required', 'string', 'max:180'],
            'owner_citizenship_number' => ['nullable', 'string', 'max:40'],
            'owner_email' => ['nullable', 'email', 'max:255'],
            'owner_phone' => ['nullable', 'string', 'max:20'],
            'business_type' => ['required', 'string', 'max:60'],
            'address' => ['required', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:100'],
            'district' => ['required', 'string', 'max:100'],
            'municipality' => ['required', 'string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $vendor = $this->user()?->vendor;
            if (! $vendor) {
                return;
            }

            foreach (['citizenship_front', 'citizenship_back', 'pan_vat', 'business_registration'] as $type) {
                if (! $vendor->documents()->where('document_type', $type)->exists()) {
                    $validator->errors()->add('documents', 'Upload all required verification documents before submitting.');

                    return;
                }
            }
        });
    }
}