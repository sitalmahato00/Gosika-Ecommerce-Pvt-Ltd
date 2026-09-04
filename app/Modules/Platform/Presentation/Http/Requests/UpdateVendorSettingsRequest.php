<?php

namespace App\Modules\Platform\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVendorSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'allow_registration'          => ['nullable', 'boolean'],
            'require_admin_approval'      => ['nullable', 'boolean'],
            'require_kyc'                 => ['nullable', 'boolean'],
            'auto_approve'                => ['nullable', 'boolean'],
            
            // KYC Requirements
            'require_citizenship'         => ['nullable', 'boolean'],
            'require_pan_vat'             => ['nullable', 'boolean'],
            'require_bank_account'        => ['nullable', 'boolean'],
            'require_business_doc'        => ['nullable', 'boolean'],
            
            // Store & Product Rules
            'vendor_can_create_store'     => ['nullable', 'boolean'],
            'store_approval_required'     => ['nullable', 'boolean'],
            'auto_approve_stores'         => ['nullable', 'boolean'],
            'auto_approve_products'       => ['nullable', 'boolean'],
            'require_product_images'      => ['nullable', 'boolean'],
            'require_product_category'    => ['nullable', 'boolean'],
            'require_product_brand'       => ['nullable', 'boolean'],
            'require_initial_stock'       => ['nullable', 'boolean'],
            'allow_guest_browse'          => ['nullable', 'boolean'],
            
            // Limits
            'max_products_per_vendor'     => ['nullable', 'integer', 'min:1'],
            'max_images_per_product'      => ['nullable', 'integer', 'min:1', 'max:20'],
            'max_image_upload_size_mb'    => ['nullable', 'numeric', 'min:0.5', 'max:50'],
            'max_store_banner_size_mb'    => ['nullable', 'numeric', 'min:0.5', 'max:50'],
        ];
    }
}
