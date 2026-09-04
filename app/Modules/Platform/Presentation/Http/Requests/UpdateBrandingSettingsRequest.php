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
            
            // Uploaded files if submitted via multipart
            'logo_light_file'           => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'logo_dark_file'            => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:2048'],
            'favicon_file'              => ['nullable', 'mimes:ico,png,svg', 'max:1024'],
            'login_bg_file'             => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
            'email_logo_file'           => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            
            // String URL fallbacks
            'logo_light'                => ['nullable', 'string', 'max:500'],
            'logo_dark'                 => ['nullable', 'string', 'max:500'],
            'favicon_url'               => ['nullable', 'string', 'max:500'],
            'login_bg_url'              => ['nullable', 'string', 'max:500'],
            'email_logo_url'            => ['nullable', 'string', 'max:500'],
        ];
    }
}
