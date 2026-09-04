<?php

namespace App\Modules\Platform\Presentation\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCommissionSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'commission_enabled'       => ['nullable', 'boolean'],
            'default_commission_type'  => ['nullable', 'string', 'in:percentage,fixed,percentage_plus_fixed'],
            'default_rate'             => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fixed_commission_amount'  => ['nullable', 'numeric', 'min:0'],
            'min_commission'           => ['nullable', 'numeric', 'min:0'],
            'max_commission'           => ['nullable', 'numeric', 'min:0'],
            
            // Calculation Basis
            'calculation_basis'        => ['nullable', 'string', 'in:product_subtotal,product_total,order_total'],
            'delivery_fee_included'    => ['nullable', 'boolean'],
            'discount_funding'         => ['nullable', 'string', 'in:platform,vendor,proportional'],
            'tax_calculation_point'    => ['nullable', 'string', 'in:before_commission,after_commission'],
            
            // Payouts & Settlements
            'vendor_payouts_enabled'   => ['nullable', 'boolean'],
            'payout_frequency'         => ['nullable', 'string', 'in:manual,daily,weekly,biweekly,monthly'],
            'min_payout_amount'        => ['nullable', 'numeric', 'min:0'],
            'payout_processing_fee'    => ['nullable', 'numeric', 'min:0'],
            'settlement_holding_days'  => ['nullable', 'integer', 'min:0', 'max:365'],
            'require_delivery_for_settlement' => ['nullable', 'boolean'],
            'require_return_window_expiry'    => ['nullable', 'boolean'],
            'require_manual_payout_approval'  => ['nullable', 'boolean'],
            'auto_payout_enabled'      => ['nullable', 'boolean'],
        ];
    }
}
