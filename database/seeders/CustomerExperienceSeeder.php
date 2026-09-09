<?php

namespace Database\Seeders;

use App\Modules\Customer\Infrastructure\Models\CustomerAddress;
use App\Modules\Customer\Infrastructure\Models\CustomerProfile;
use App\Modules\Customer\Infrastructure\Models\CustomerWallet;
use App\Modules\Customer\Infrastructure\Models\CustomerWalletTransaction;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Platform\Infrastructure\Models\Country;
use App\Modules\Platform\Infrastructure\Models\District;
use App\Modules\Platform\Infrastructure\Models\Municipality;
use App\Modules\Platform\Infrastructure\Models\Province;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Shared\Domain\Enums\OrderPaymentStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\TicketStatus;
use App\Modules\Support\Infrastructure\Models\SupportTicket;
use App\Modules\Support\Infrastructure\Models\TicketMessage;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CustomerExperienceSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['first' => 'Sunsari', 'last' => 'Sharma', 'email' => 'sunsari.sharma@example.com', 'phone' => '9800000101', 'gender' => 'female', 'dob' => '1994-04-12', 'city' => ['Kathmandu', 'Kathmandu', 'Kathmandu', 'Boudhanath']],
            ['first' => 'Karan', 'last' => 'Gurung', 'email' => 'karan.gurung@example.com', 'phone' => '9800000102', 'gender' => 'male', 'dob' => '1991-11-03', 'city' => ['Pokhara', 'Kaski', 'Kaski', 'Lakeside']],
            ['first' => 'Priya', 'last' => 'Tamang', 'email' => 'priya.tamang@example.com', 'phone' => '9800000103', 'gender' => 'female', 'dob' => '1996-07-25', 'city' => ['Biratnagar', 'Morang', 'Morang', 'Peoples Plaza']],
            ['first' => 'Bibek', 'last' => 'Rai', 'email' => 'bibek.rai@example.com', 'phone' => '9800000104', 'gender' => 'male', 'dob' => '1989-02-19', 'city' => ['Itahari', 'Sunsari', 'Sunsari', 'Itahari Chowk']],
            ['first' => 'Anisha', 'last' => 'Shrestha', 'email' => 'anisha.shrestha@example.com', 'phone' => '9800000105', 'gender' => 'female', 'dob' => '1998-09-30', 'city' => ['Lalitpur', 'Lalitpur', 'Lalitpur', 'Patan Dhoka']],
            ['first' => 'Dawa', 'last' => 'Lama', 'email' => 'dawa.lama@example.com', 'phone' => '9800000106', 'gender' => 'male', 'dob' => '1993-05-08', 'city' => ['Boudha', 'Kathmandu', 'Kathmandu', 'Boudha Stupa']],
        ];

        $store = Store::query()->first();
        if (! $store) {
            return;
        }
        $products = Product::query()->where('status', 'published')->orderBy('id')->get(['id', 'name', 'sku', 'price']);
        $admin = User::query()->role(Roles::SUPER_ADMIN)->first();
        $country = Country::where('code', 'NP')->first();
        $commissionRate = (float) ($store?->vendor?->commission_rate ?? 10);

        $deliveryStatusFor = fn (OrderStatus $s) => match ($s) {
            OrderStatus::COMPLETED => 'delivered',
            OrderStatus::PROCESSING => 'out_for_delivery',
            OrderStatus::PENDING => 'pending',
            OrderStatus::RETURNED => 'returned_to_vendor',
            default => 'failed',
        };

        $walletSeeds = [
            'sunsari.sharma@example.com' => [
                ['type' => 'cashback_reward', 'amount' => 500.00, 'desc' => 'Welcome cashback on first order'],
                ['type' => 'refund_credit', 'amount' => 780.00, 'desc' => 'Refund for cancelled Ginger Tea order', 'order_ref' => true],
                ['type' => 'cashback_reward', 'amount' => 60.00, 'desc' => 'Order cashback #10'],
            ],
            'karan.gurung@example.com' => [
                ['type' => 'cashback_reward', 'amount' => 500.00, 'desc' => 'Welcome cashback on first order'],
            ],
            'priya.tamang@example.com' => [
                ['type' => 'cashback_reward', 'amount' => 500.00, 'desc' => 'Welcome cashback on first order'],
                ['type' => 'cashback_reward', 'amount' => 90.00, 'desc' => 'Order cashback #22'],
                ['type' => 'refund_credit', 'amount' => 700.00, 'desc' => 'Refund for cancelled Khata order', 'order_ref' => true],
            ],
            'bibek.rai@example.com' => [
                ['type' => 'cashback_reward', 'amount' => 850.00, 'desc' => 'Loyalty cashback'],
            ],
            'anisha.shrestha@example.com' => [
                ['type' => 'cashback_reward', 'amount' => 500.00, 'desc' => 'Welcome cashback on first order'],
                ['type' => 'refund_credit', 'amount' => 1520.00, 'desc' => 'Refund for returned Wooden Candle Holder', 'order_ref' => true],
            ],
            'dawa.lama@example.com' => [
                ['type' => 'cashback_reward', 'amount' => 500.00, 'desc' => 'Welcome cashback on first order'],
                ['type' => 'refund_credit', 'amount' => 4500.00, 'desc' => 'Refund for returned Hand-Knotted Thangka', 'order_ref' => true],
            ],
        ];

        $ordersPlan = [
            'sunsari.sharma@example.com' => [
                [10, 3, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 84],
                [2, 1, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 77],
                [5, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 63],
                [1, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 41],
                [6, 1, OrderStatus::CANCELLED, OrderPaymentStatus::REFUNDED, 33],
                [7, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 24],
                [3, 4, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 9],
                [4, 2, OrderStatus::PROCESSING, OrderPaymentStatus::PAID, 1],
            ],
            'karan.gurung@example.com' => [
                [1, 1, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 70],
                [3, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 58],
                [9, 3, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 45],
                [5, 2, OrderStatus::CANCELLED, OrderPaymentStatus::REFUNDED, 37],
                [10, 4, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 20],
                [2, 1, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 12],
                [8, 2, OrderStatus::PROCESSING, OrderPaymentStatus::PAID, 2],
            ],
            'priya.tamang@example.com' => [
                [4, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 65],
                [9, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 52],
                [7, 1, OrderStatus::CANCELLED, OrderPaymentStatus::REFUNDED, 40],
                [3, 3, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 28],
                [10, 4, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 15],
                [6, 1, OrderStatus::PENDING, OrderPaymentStatus::PENDING, 0],
            ],
            'bibek.rai@example.com' => [
                [8, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 55],
                [6, 1, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 38],
                [4, 3, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 22],
                [5, 1, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 11],
                [7, 2, OrderStatus::PENDING, OrderPaymentStatus::PENDING, 3],
            ],
            'anisha.shrestha@example.com' => [
                [2, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 72],
                [5, 3, OrderStatus::RETURNED, OrderPaymentStatus::REFUNDED, 49],
                [9, 4, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 31],
                [10, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 18],
                [1, 1, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 8],
                [3, 2, OrderStatus::PROCESSING, OrderPaymentStatus::PAID, 1],
            ],
            'dawa.lama@example.com' => [
                [1, 1, OrderStatus::RETURNED, OrderPaymentStatus::REFUNDED, 60],
                [3, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 44],
                [7, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 26],
                [9, 2, OrderStatus::COMPLETED, OrderPaymentStatus::PAID, 6],
                [4, 3, OrderStatus::PENDING, OrderPaymentStatus::PENDING, 1],
            ],
        ];

        $deliveryAreas = [
            'Kathmandu' => ['Kathmandu', 'Kathmandu', 'Kathmandu'],
            'Kaski' => ['Pokhara', 'Kaski', 'Kaski'],
            'Lalitpur' => ['Patan', 'Lalitpur', 'Lalitpur'],
            'Morang' => ['Biratnagar', 'Morang', 'Morang'],
            'Sunsari' => ['Itahari', 'Sunsari', 'Sunsari'],
        ];

        $ticketPlan = [
            ['who' => 0, 'subject' => 'Order not delivered yet - urgent', 'category' => 'order_status', 'priority' => 'urgent', 'status' => TicketStatus::OPEN, 'desc' => 'My order GSK-#ORD# was placed today on COD but the confirmation SMS never arrived. Please confirm whether the order went through.', 'support' => false],
            ['who' => 1, 'subject' => 'Change delivery address for order', 'category' => 'delivery', 'priority' => 'normal', 'status' => TicketStatus::PENDING, 'desc' => 'I will be out of town this week. Please redirect order GSK-#ORD# to my office address in Pokhara instead.', 'support' => true],
            ['who' => 2, 'subject' => 'Payment deducted twice for one order', 'category' => 'payment', 'priority' => 'urgent', 'status' => TicketStatus::OPEN, 'desc' => 'Unexpectedly charged twice for order GSK-#ORD#. My bank statement shows two identical debits. Please initiate a refund for one.', 'support' => true],
            ['who' => 4, 'subject' => 'Scarf quality does not match photos', 'category' => 'product_issue', 'priority' => 'normal', 'status' => TicketStatus::PENDING, 'desc' => 'The Handwoven Wool Scarf from order GSK-#ORD# has a loose weave and a small stain. Can I exchange it?', 'support' => true],
            ['who' => 5, 'subject' => 'Refund status for returned thangka', 'category' => 'refund', 'priority' => 'normal', 'status' => TicketStatus::RESOLVED, 'desc' => 'My returned Hand-Knotted Thangka was received by the store two weeks ago. I would like to know when the refund will be credited.', 'support' => true],
        ];

        foreach ($customers as $tuple) {
            $user = User::firstOrCreate(
                ['email' => $tuple['email']],
                [
                    'uuid' => (string) Str::uuid(),
                    'first_name' => $tuple['first'],
                    'last_name' => $tuple['last'],
                    'phone' => $tuple['phone'],
                    'password' => '$2y$12$uMCGvcnif7G1i3tUYQfJUepUuVkx8K2oR3OeYrDtFfYxYbWDybdge', // password
                    'email_verified_at' => now(),
                    'phone_verified_at' => now(),
                    'status' => \App\Modules\Shared\Domain\Enums\UserStatus::ACTIVE,
                ]
            );
            if (! $user->hasRole(Roles::CUSTOMER)) {
                $user->assignRole(Roles::CUSTOMER);
            }

            CustomerProfile::updateOrCreate(
                ['user_id' => $user->id],
                ['gender' => $tuple['gender'], 'date_of_birth' => $tuple['dob'], 'preferences' => ['newsletter' => true, 'promotions' => false]]
            );

            $addressIds = [];
            foreach (['Home', 'Office'] as $i => $label) {
                $province = Province::where('name', $deliveryAreas[$tuple['city'][1]][1] ?? $tuple['city'][1])->first() ?? Province::first();
                $district = District::where('name', $tuple['city'][2] ?? $deliveryAreas[$tuple['city'][1]][2])->first()
                    ?? District::where('province_id', $province->id)->first()
                    ?? District::first();
                $municipality = Municipality::where('name', $tuple['city'][3] ?? null)->first()
                    ?? Municipality::where('district_id', $district->id)->first()
                    ?? Municipality::first();
                $addr = CustomerAddress::updateOrCreate(
                    ['user_id' => $user->id, 'label' => $label],
                    [
                        'address_type' => $i === 0 ? 'home' : 'work',
                        'full_name' => "{$tuple['first']} {$tuple['last']}",
                        'phone' => $tuple['phone'],
                        'address_line_1' => 'Galli '.($i + 1).", {$tuple['city'][3]}",
                        'address_line_2' => $label,
                        'country_id' => $country?->id,
                        'province_id' => $province->id,
                        'district_id' => $district->id,
                        'municipality_id' => $municipality->id,
                        'postal_code' => '44600',
                        'is_default' => $i === 0,
                    ]
                );
                $addressIds[$label] = $addr->id;
            }

            $customerOrders = [];
            $lastOrder = null;
            foreach ($ordersPlan[$tuple['email']] as [$productRow, $qty, $status, $paymentStatus, $daysAgo]) {
                $product = $products[$productRow - 1] ?? $products->first();
                $lineTotal = (float) $product->price * $qty;
                $subtotal = round($lineTotal, 2);
                $tax = round($subtotal * 0.13, 2);
                $delivery = 120.00;
                $grandTotal = round($subtotal + $tax + $delivery, 2);
                $placedAt = now()->subDays($daysAgo)->setTime(random_int(8, 19), random_int(0, 59));

                $orderNumber = 'GSK-'.Str::upper(Str::random(6));
                if (Order::where('order_number', $orderNumber)->exists()) {
                    $orderNumber = 'GSK-'.Str::upper(Str::random(6));
                }

                $order = Order::create([
                    'order_number' => $orderNumber,
                    'user_id' => $user->id,
                    'shipping_address_id' => $addressIds['Home'],
                    'shipping_address_snapshot' => json_encode([
                        'full_name' => "{$tuple['first']} {$tuple['last']}",
                        'phone' => $tuple['phone'],
                        'line_1' => "Galli 1, {$tuple['city'][3]}",
                        'district' => $district->name ?? 'Kathmandu',
                        'province' => $province->name ?? 'Bagmati Province',
                    ]),
                    'payment_method' => $paymentStatus === OrderPaymentStatus::PENDING ? 'cash_on_delivery' : 'esewa',
                    'payment_status' => $paymentStatus,
                    'status' => $status,
                    'subtotal' => $subtotal,
                    'discount' => 0,
                    'delivery_charge' => $delivery,
                    'tax' => $tax,
                    'grand_total' => $grandTotal,
                    'currency' => 'NPR',
                    'placed_at' => $placedAt,
                    'confirmed_at' => in_array($status, [OrderStatus::COMPLETED, OrderStatus::PROCESSING, OrderStatus::RETURNED]) ? $placedAt->copy()->addHours(4) : null,
                    'completed_at' => in_array($status, [OrderStatus::COMPLETED]) ? $placedAt->copy()->addDays(2) : null,
                    'cancelled_at' => $status === OrderStatus::CANCELLED ? $placedAt->copy()->addDays(1) : null,
                    'cancelled_reason' => $status === OrderStatus::CANCELLED ? 'Customer requested cancellation' : null,
                ]);

                $vendorOrder = VendorOrder::create([
                    'vendor_order_number' => 'VOD-'.Str::upper(Str::random(6)),
                    'order_id' => $order->id,
                    'vendor_id' => $store->vendor_id,
                    'store_id' => $store->id,
                    'status' => $status,
                    'delivery_status' => $deliveryStatusFor($status),
                    'items_subtotal' => $subtotal,
                    'discount' => 0,
                    'delivery_charge' => $delivery,
                    'tax' => $tax,
                    'grand_total' => $grandTotal,
                    'commission_rate' => $commissionRate,
                    'commission_amount' => round($subtotal * ($commissionRate / 100), 2),
                    'vendor_payable' => round($subtotal - ($subtotal * ($commissionRate / 100)), 2),
                ]);

                OrderItem::create([
                    'order_id' => $order->id,
                    'vendor_order_id' => $vendorOrder->id,
                    'vendor_id' => $store->vendor_id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'quantity' => $qty,
                    'unit_price' => (float) $product->price,
                    'unit_discount' => 0,
                    'line_total' => $subtotal,
                    'delivery_status' => $deliveryStatusFor($status),
                ]);

                $customerOrders[$orderNumber] = $order;
                $lastOrder = $order;
            }
            $this->command?->info("Seeded customer {$tuple['email']} with ".count($customerOrders).' orders.');

            $wallet = CustomerWallet::updateOrCreate(
                ['user_id' => $user->id],
                ['balance' => 0, 'currency' => 'NPR', 'version' => 1]
            );
            $running = 0;
            foreach ($walletSeeds[$tuple['email']] as $i => $seed) {
                $refOrder = null;
                if (($seed['order_ref'] ?? false) && $lastOrder) {
                    $refOrder = $lastOrder;
                }
                $running += $seed['amount'];
                CustomerWalletTransaction::updateOrCreate(
                    ['wallet_id' => $wallet->id, 'transaction_type' => $seed['type'], 'description' => $seed['desc']],
                    [
                        'reference_type' => $refOrder ? 'order' : null,
                        'reference_id' => $refOrder?->id,
                        'amount' => $seed['amount'],
                        'balance_before' => round($running - $seed['amount'], 2),
                        'balance_after' => round($running, 2),
                        'description' => $seed['desc'],
                    ]
                );
            }
            $wallet->balance = round($running, 2);
            $wallet->save();
            $this->command?->info("Seeded customer wallet for {$tuple['email']} balance NPR {$wallet->balance}.");
        }

        $orderPool = Order::query()->latest('placed_at')->limit(120)->get();

        foreach ($ticketPlan as $idx => $plan) {
            $user = $customers[$plan['who']];
            $u = User::where('email', $user['email'])->first();
            $order = $orderPool->filter(fn ($o) => $o->user_id === $u->id)->sortByDesc('placed_at')->first()
                ?? Order::where('user_id', $u->id)->latest('placed_at')->first();

            $ticketNumber = 'TCK-'.Str::upper(Str::random(8));
            $ticket = SupportTicket::create([
                'ticket_number' => $ticketNumber,
                'user_id' => $u->id,
                'vendor_id' => null,
                'order_id' => $order?->id,
                'subject' => Str::replace('#ORD#', $order?->order_number ?? 'N/A', $plan['subject']),
                'description' => Str::replace('#ORD#', $order?->order_number ?? 'N/A', $plan['desc']),
                'category' => $plan['category'],
                'priority' => $plan['priority'],
                'status' => $plan['status'],
                'assigned_to' => $admin?->id,
                'resolved_at' => $plan['status'] === TicketStatus::RESOLVED ? now()->subDays(2) : null,
                'meta' => ['seeded' => true],
            ]);

            TicketMessage::create([
                'support_ticket_id' => $ticket->id,
                'sender_user_id' => $u->id,
                'message' => $plan['desc'],
                'is_internal' => false,
            ]);

            if ($plan['support']) {
                TicketMessage::create([
                    'support_ticket_id' => $ticket->id,
                    'sender_user_id' => $admin->id,
                    'message' => 'Hello, thank you for reaching out. Our support team is looking into this right now and we will follow up within 24 hours.',
                    'is_internal' => false,
                ]);
            }

            if ($plan['status'] === TicketStatus::RESOLVED) {
                TicketMessage::create([
                    'support_ticket_id' => $ticket->id,
                    'sender_user_id' => $admin->id,
                    'message' => 'Resolved: The refund was processed successfully to your wallet. Keep this ticket open if you need anything else.',
                    'is_internal' => false,
                ]);
            }

            $this->command?->info("Seeded support ticket {$ticket->ticket_number} ({$ticket->subject}).");
        }
    }
}