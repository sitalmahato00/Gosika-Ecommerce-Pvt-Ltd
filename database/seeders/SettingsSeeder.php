<?php

namespace Database\Seeders;

use App\Modules\Platform\Infrastructure\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['commission.default_rate', '10', 'commission', 'decimal'],
            ['commission.product_rate', null, 'commission', 'decimal'],
            ['commission.category_rate', null, 'commission', 'decimal'],
            ['return.window_days', '7', 'return', 'integer'],
            ['return.allow_returns', 'true', 'return', 'boolean'],
            ['shipping.flat_charge', '80', 'shipping', 'decimal'],
            ['shipping.free_delivery_threshold', '2000', 'shipping', 'decimal'],
            ['checkout.cod_enabled', 'true', 'checkout', 'boolean'],
            ['checkout.cod_max_amount', '50000', 'checkout', 'decimal'],
            ['checkout.min_order_amount', '0', 'checkout', 'decimal'],
            ['payment.khalti_enabled', 'false', 'payment', 'boolean'],
            ['payment.expiration_minutes', '60', 'payment', 'integer'],
            ['settlement.waiting_days', '7', 'settlement', 'integer'],
            ['settlement.min_payout_amount', '1000', 'settlement', 'decimal'],
            ['currency.code', 'NPR', 'currency', 'string'],
            ['marketplace.initial_market', 'Koshi Province, Nepal', 'marketplace', 'string'],
        ];

        foreach ($settings as [$key, $value, $group, $type]) {
            Setting::set($key, $value, $group, $type, isPublic: true);
        }
    }
}
