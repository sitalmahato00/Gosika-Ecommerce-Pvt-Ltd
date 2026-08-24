<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class DashboardDemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🌱 Rapidly generating dashboard data...');

        // 1. Get or create vendors
        $vendorList = DB::table('vendors')->get(['id', 'user_id'])->toArray();
        if (count($vendorList) < 5) {
            $names = ['Himalayan Crafts', 'Nepal Textile Hub', 'Kathmandu Artisans', 'Pokhara Goods', 'Everest Organics', 'Thamel Exports'];
            $pass = Hash::make('password');
            foreach ($names as $idx => $vName) {
                $email = 'vendor_demo_' . $idx . '@gosika.com.np';
                $uid = DB::table('users')->where('email', $email)->value('id');
                if (!$uid) {
                    $uid = DB::table('users')->insertGetId([
                        'uuid' => (string) Str::uuid(),
                        'first_name' => explode(' ', $vName)[0],
                        'last_name' => explode(' ', $vName)[1] ?? 'Store',
                        'email' => $email,
                        'phone' => '9801' . str_pad($idx, 6, '0', STR_PAD_LEFT),
                        'password' => $pass,
                        'status' => 'active',
                        'email_verified_at' => now(),
                        'phone_verified_at' => now(),
                        'created_at' => now()->subDays(90),
                        'updated_at' => now(),
                    ]);
                }

                $vid = DB::table('vendors')->where('user_id', $uid)->value('id');
                if (!$vid) {
                    $vid = DB::table('vendors')->insertGetId([
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $uid,
                        'company_name' => $vName,
                        'business_email' => $email,
                        'status' => 'approved',
                        'commission_rate' => 10.00,
                        'created_at' => now()->subDays(90),
                        'updated_at' => now(),
                    ]);
                }

                $sid = DB::table('stores')->where('vendor_id', $vid)->value('id');
                if (!$sid) {
                    DB::table('stores')->insertGetId([
                        'uuid' => (string) Str::uuid(),
                        'vendor_id' => $vid,
                        'name' => $vName . ' Official Store',
                        'slug' => Str::slug($vName) . '-official',
                        'status' => 'approved',
                        'created_at' => now()->subDays(90),
                        'updated_at' => now(),
                    ]);
                }

                $wid = DB::table('vendor_wallets')->where('vendor_id', $vid)->value('id');
                if (!$wid) {
                    DB::table('vendor_wallets')->insertGetId([
                        'vendor_id' => $vid,
                        'balance' => rand(20000, 90000),
                        'available_balance' => rand(15000, 75000),
                        'pending_balance' => rand(3000, 15000),
                        'created_at' => now()->subDays(90),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        // Fetch all active vendors and stores
        $vendorsWithStores = DB::table('vendors')
            ->join('stores', 'stores.vendor_id', '=', 'vendors.id')
            ->select('vendors.id as vendor_id', 'stores.id as store_id')
            ->get()
            ->toArray();

        if (empty($vendorsWithStores)) {
            $firstVendorId = DB::table('vendors')->value('id') ?? 1;
            $firstStoreId = DB::table('stores')->value('id') ?? 1;
            $vendorsWithStores = [(object)['vendor_id' => $firstVendorId, 'store_id' => $firstStoreId]];
        }

        // Fetch customer IDs (all users)
        $customerIds = DB::table('users')->pluck('id')->toArray();
        if (count($customerIds) < 20) {
            $pass = Hash::make('password');
            for ($k = 0; $k < 30; $k++) {
                $cid = DB::table('users')->insertGetId([
                    'uuid' => (string) Str::uuid(),
                    'first_name' => 'Customer',
                    'last_name' => 'Demo ' . $k,
                    'email' => 'customer_' . $k . '_' . rand(100, 999) . '@gosika.com.np',
                    'phone' => '9841' . str_pad($k, 6, '0', STR_PAD_LEFT),
                    'password' => $pass,
                    'status' => 'active',
                    'email_verified_at' => now(),
                    'phone_verified_at' => now(),
                    'created_at' => now()->subDays(rand(1, 90)),
                    'updated_at' => now(),
                ]);
                $customerIds[] = $cid;
            }
        }

        // Fetch products
        $products = DB::table('products')->get(['id', 'name', 'sku', 'price'])->toArray();
        if (empty($products)) {
            $products = [
                (object)['id' => 1, 'name' => 'Handmade Pashmina Shawl', 'sku' => 'SKU-PAS-01', 'price' => 3500],
                (object)['id' => 2, 'name' => 'Tibetan Singing Bowl Set', 'sku' => 'SKU-BOWL-02', 'price' => 4200],
                (object)['id' => 3, 'name' => 'Organic Himalayan Green Tea', 'sku' => 'SKU-TEA-03', 'price' => 850],
                (object)['id' => 4, 'name' => 'Carved Wooden Mask', 'sku' => 'SKU-MASK-04', 'price' => 2200],
                (object)['id' => 5, 'name' => 'Handwoven Hemp Backpack', 'sku' => 'SKU-BAG-05', 'price' => 1850],
            ];
        }

        $statuses = ['pending', 'confirmed', 'processing', 'out_for_delivery', 'delivered', 'delivered', 'delivered', 'delivered', 'cancelled'];
        $paymentMethods = ['cod', 'esewa', 'khalti', 'cod', 'esewa', 'fonepay', 'esewa'];
        $provinces = ['Bagmati Province', 'Koshi Province', 'Gandaki Province', 'Lumbini Province', 'Madhesh Province'];
        $districts = ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Birgunj', 'Chitwan', 'Dharan', 'Butwal'];

        $this->command->info('  → Inserting 90 days of transactions...');
        $orderCount = 0;

        for ($daysAgo = 90; $daysAgo >= 0; $daysAgo--) {
            // Increasing sales volume toward recent days
            $dailyCount = $daysAgo <= 14 ? rand(4, 9) : ($daysAgo <= 45 ? rand(2, 6) : rand(1, 3));
            $date = Carbon::now()->subDays($daysAgo);

            for ($i = 0; $i < $dailyCount; $i++) {
                $uid = $customerIds[array_rand($customerIds)];
                $status = $statuses[array_rand($statuses)];
                $method = $paymentMethods[array_rand($paymentMethods)];
                $isPaid = in_array($status, ['delivered', 'completed']) ? 'paid' : (rand(0, 1) ? 'paid' : 'pending');

                $pair = $vendorsWithStores[array_rand($vendorsWithStores)];
                $vendorId = $pair->vendor_id;
                $storeId  = $pair->store_id;

                $numItems = rand(1, 3);
                $subtotal = 0;
                $items = [];

                for ($j = 0; $j < $numItems; $j++) {
                    $p = $products[array_rand($products)];
                    $qty = rand(1, 3);
                    $price = (float) $p->price > 0 ? (float) $p->price : (float) rand(600, 4000);
                    $lineTotal = $price * $qty;
                    $subtotal += $lineTotal;

                    $items[] = [
                        'uuid' => (string) Str::uuid(),
                        'product_id' => $p->id,
                        'vendor_id' => $vendorId,
                        'product_name' => $p->name,
                        'sku' => $p->sku ?? ('SKU-' . rand(1000, 9999)),
                        'quantity' => $qty,
                        'unit_price' => $price,
                        'unit_discount' => 0,
                        'line_total' => $lineTotal,
                        'delivery_status' => $status,
                    ];
                }

                $deliveryCharge = rand(0, 1) ? 0 : 150.00;
                $discount = rand(0, 3) === 0 ? round($subtotal * 0.08, 2) : 0;
                $grandTotal = max(0, $subtotal + $deliveryCharge - $discount);
                $orderNum = 'ORD-' . $date->format('Y') . '-' . strtoupper(Str::random(6));
                $createdAt = $date->copy()->addHours(rand(8, 22))->addMinutes(rand(0, 59));

                $orderId = DB::table('orders')->insertGetId([
                    'uuid' => (string) Str::uuid(),
                    'order_number' => $orderNum,
                    'user_id' => $uid,
                    'payment_method' => $method,
                    'payment_status' => $isPaid,
                    'status' => $status,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'delivery_charge' => $deliveryCharge,
                    'tax' => 0,
                    'grand_total' => $grandTotal,
                    'currency' => 'NPR',
                    'shipping_address_snapshot' => json_encode([
                        'province' => $provinces[array_rand($provinces)],
                        'district' => $districts[array_rand($districts)],
                        'city' => 'City Center',
                    ]),
                    'placed_at' => $createdAt,
                    'confirmed_at' => in_array($status, ['confirmed', 'processing', 'out_for_delivery', 'delivered']) ? $createdAt->copy()->addMinutes(15) : null,
                    'completed_at' => $status === 'delivered' ? $createdAt->copy()->addDays(2) : null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                $commissionRate = 10.00;
                $commissionAmt = round($grandTotal * 0.10, 2);

                $vendorOrderId = DB::table('vendor_orders')->insertGetId([
                    'uuid' => (string) Str::uuid(),
                    'vendor_order_number' => 'VO-' . strtoupper(Str::random(8)),
                    'order_id' => $orderId,
                    'vendor_id' => $vendorId,
                    'store_id' => $storeId,
                    'status' => $status,
                    'delivery_status' => $status,
                    'items_subtotal' => $subtotal,
                    'discount' => $discount,
                    'delivery_charge' => $deliveryCharge,
                    'tax' => 0,
                    'grand_total' => $grandTotal,
                    'commission_rate' => $commissionRate,
                    'commission_amount' => $commissionAmt,
                    'vendor_payable' => $grandTotal - $commissionAmt,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);

                foreach ($items as $item) {
                    $item['order_id'] = $orderId;
                    $item['vendor_order_id'] = $vendorOrderId;
                    $item['created_at'] = $createdAt;
                    $item['updated_at'] = $createdAt;
                    DB::table('order_items')->insert($item);
                }

                if (in_array($status, ['delivered', 'completed'])) {
                    DB::table('commissions')->insert([
                        'uuid' => (string) Str::uuid(),
                        'vendor_order_id' => $vendorOrderId,
                        'order_id' => $orderId,
                        'vendor_id' => $vendorId,
                        'rate' => $commissionRate,
                        'basis_amount' => $grandTotal,
                        'amount' => $commissionAmt,
                        'status' => 'calculated',
                        'calculated_at' => $createdAt,
                        'created_at' => $createdAt,
                        'updated_at' => $createdAt,
                    ]);
                }

                $orderCount++;
            }
        }

        // Payout requests
        $wallets = DB::table('vendor_wallets')->get(['id', 'vendor_id'])->toArray();
        foreach ($wallets as $w) {
            for ($p = 0; $p < 2; $p++) {
                $pDate = Carbon::now()->subDays(rand(3, 50));
                DB::table('payout_requests')->insert([
                    'uuid' => (string) Str::uuid(),
                    'payout_number' => 'PO-' . strtoupper(Str::random(8)),
                    'vendor_id' => $w->vendor_id,
                    'wallet_id' => $w->id,
                    'amount' => rand(5000, 25000),
                    'status' => collect(['pending', 'approved', 'paid'])->random(),
                    'requested_at' => $pDate,
                    'created_at' => $pDate,
                    'updated_at' => $pDate,
                ]);
            }
        }

        $this->command->info("🎉 Done! Generated {$orderCount} orders across 90 days. All charts are populated!");
    }
}
