<?php

namespace Database\Seeders;

use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['commission.default_rate', '10', 'commission', 'decimal', true],
            ['commission.product_rate', null, 'commission', 'decimal', true],
            ['commission.category_rate', null, 'commission', 'decimal', true],
            ['return.window_days', '7', 'return', 'integer', true],
            ['return.allow_returns', 'true', 'return', 'boolean', true],
            ['shipping.flat_charge', '80', 'shipping', 'decimal', true],
            ['shipping.free_delivery_threshold', '2000', 'shipping', 'decimal', true],
            ['checkout.cod_enabled', 'true', 'checkout', 'boolean', true],
            ['checkout.cod_max_amount', '50000', 'checkout', 'decimal', true],
            ['checkout.min_order_amount', '0', 'checkout', 'decimal', true],
            ['payment.cod_instructions', 'Pay with cash upon delivery. Please keep exact change ready.', 'payment', 'string', true],
            ['payment.cod_min_amount', '0', 'payment', 'decimal', true],
            ['payment.cod_max_amount', '50000', 'payment', 'decimal', true],
            ['payment.khalti_enabled', 'false', 'payment', 'boolean', true],
            ['payment.khalti_environment', 'uat', 'payment', 'string', true],
            ['payment.khalti_base_url', 'https://dev.khalti.com/api/v2', 'payment', 'string', false],
            ['payment.khalti_secret_key', '', 'payment', 'string', false],
            ['payment.khalti_public_key', '', 'payment', 'string', false],
            ['payment.esewa_enabled', 'false', 'payment', 'boolean', true],
            ['payment.esewa_environment', 'uat', 'payment', 'string', true],
            ['payment.esewa_product_code', 'EPAYTEST', 'payment', 'string', true],
            ['payment.esewa_secret_key', '8gBm/:&EnhH.1/q', 'payment', 'string', false],
            ['payment.expiration_minutes', '60', 'payment', 'integer', true],
            ['settlement.waiting_days', '7', 'settlement', 'integer', true],
            ['settlement.min_payout_amount', '1000', 'settlement', 'decimal', true],
            ['currency.code', 'NPR', 'currency', 'string', true],
            ['marketplace.initial_market', 'Koshi Province, Nepal', 'marketplace', 'string', true],
        ];

        foreach ($settings as [$key, $value, $group, $type, $isPublic]) {
            Setting::set($key, $value, $group, $type, isPublic: $isPublic);
        }
    }
}
