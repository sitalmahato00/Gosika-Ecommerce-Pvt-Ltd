<?php

namespace App\Modules\Platform\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBrandingSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'brand_name'                => ['nullable', 'string', 'max:120'],
            'primary_color'             => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'secondary_color'           => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'accent_color'              => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'success_color'             => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'warning_color'             => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'error_color'               => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'admin_theme'               => ['nullable', 'string', 'in:light,dark,system'],
            'sidebar_default'           => ['nullable', 'string', 'in:expanded,collapsed'],
            'homepage_hero_text'        => ['nullable', 'string', 'max:255'],
            'homepage_hero_sub'         => ['nullable', 'string', 'max:500'],
            'footer_text'               => ['nullable', 'string', 'max:500'],
            'login_heading'             => ['nullable', 'string', 'max:150'],
            'login_description'         => ['nullable', 'string', 'max:500'],
            'email_header'              => ['nullable', 'string', 'max:255'],
            'email_footer'              => ['nullable', 'string', 'max:500'],
            'email_accent_color'        => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            
            // Uploaded files if submitted via multipart (no size limit enforced)
            'logo_light_file'           => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp'],
            'logo_dark_file'            => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp'],
            'favicon_file'              => ['nullable', 'mimes:ico,png,svg'],
            'login_bg_file'             => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp'],
            'email_logo_file'           => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp'],
            
            // String URL fallbacks
            'logo_light'                => ['nullable', 'string', 'max:500'],
            'logo_dark'                 => ['nullable', 'string', 'max:500'],
            'favicon_url'               => ['nullable', 'string', 'max:500'],
            'login_bg_url'              => ['nullable', 'string', 'max:500'],
            'email_logo_url'            => ['nullable', 'string', 'max:500'],

            // Storefront content
            'storefront_tagline'        => ['nullable', 'string', 'max:255'],
            'vendor_banner_text'        => ['nullable', 'string', 'max:255'],
            'announcement_banner'       => ['nullable', 'string', 'max:255'],
            'footer_legal'              => ['nullable', 'string', 'max:500'],

            // SEO & social
            'seo_meta_description'      => ['nullable', 'string', 'max:500'],
            'og_image_url'              => ['nullable', 'string', 'max:500'],
            'social_facebook'           => ['nullable', 'url', 'max:255'],
            'social_instagram'          => ['nullable', 'url', 'max:255'],
            'social_twitter'            => ['nullable', 'url', 'max:255'],
            'social_youtube'            => ['nullable', 'url', 'max:255'],

            // Marketplace trust & policy labels
            'verified_seller_label'     => ['nullable', 'string', 'max:100'],
            'authentic_product_label'   => ['nullable', 'string', 'max:100'],
            'return_policy_label'       => ['nullable', 'string', 'max:100'],
            'secure_checkout_label'     => ['nullable', 'string', 'max:100'],
            'fast_delivery_label'       => ['nullable', 'string', 'max:100'],
            'support_tagline'           => ['nullable', 'string', 'max:100'],
        ];
    }
}
