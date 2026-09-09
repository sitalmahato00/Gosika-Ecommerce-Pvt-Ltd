<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReturnsRefundsSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🌱 Seeding Returns & Exchanges + Refunds Management...');

        $existingReturns = DB::table('return_requests')->count();
        $existingRefunds = DB::table('refunds')->count();

        if ($existingReturns >= 6 && $existingRefunds >= 6) {
            $this->command->info("  → Already seeded ({$existingReturns} returns, {$existingRefunds} refunds). Skipping.");

            return;
        }

        // Pick delivered/completed orders that have at least one item + vendor package.
        $orders = DB::table('orders')
            ->join('order_items', 'order_items.order_id', '=', 'orders.id')
            ->join('vendor_orders', 'vendor_orders.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['delivered', 'completed'])
            ->select(
                'orders.id as order_id',
                'orders.user_id',
                'orders.grand_total',
                'orders.payment_method',
                'orders.created_at',
                'order_items.id as item_id',
                'order_items.line_total',
                'order_items.quantity',
                'vendor_orders.id as vo_id',
                'vendor_orders.vendor_id',
                'vendor_orders.store_id'
            )
            ->orderBy('orders.id', 'desc')
            ->limit(40)
            ->get();

        if ($orders->isEmpty()) {
            $this->command->warn('  → No delivered orders found. Run DatabaseSeeder + DashboardDemoSeeder first.');

            return;
        }

        $adminId = DB::table('users')->where('email', 'admin@gosika.com.np')->value('id')
            ?? DB::table('users')->value('id');

        $returnTypes = ['defective', 'damaged', 'wrong_item', 'not_as_described', 'size_issue', 'quality'];
        $returnReasons = [
            'defective' => 'Item stopped working within one day of delivery.',
            'damaged' => 'Product arrived damaged in transit, box was torn.',
            'wrong_item' => 'Received a different item than the one ordered.',
            'not_as_described' => 'Colour and finish do not match the listing photos.',
            'size_issue' => 'Fits smaller than the size chart suggested.',
            'quality' => 'Stitching quality is below acceptable standard.',
        ];

        $providerMap = ['esewa' => 'esewa', 'khalti' => 'khalti', 'fonepay' => 'fonepay', 'cod' => 'manual'];
        $now = now();

        // Track order_ids that already got a payment so we don't duplicate.
        $createdPayments = [];

        $returnsSeed = $existingReturns >= 6 ? 0 : 8;
        $refundsSeed = $existingRefunds >= 6 ? 0 : 8;

        $sample = $orders->shuffle();

        // ---------- RETURN REQUESTS ----------
        $returnStatuses = ['requested', 'requested', 'requested', 'under_review', 'approved', 'rejected', 'collected', 'completed'];
        $createdReturnIds = [];

        foreach ($sample->take($returnsSeed) as $idx => $order) {
            $status = $returnStatuses[$idx % count($returnStatuses)];
            $returnType = $returnTypes[array_rand($returnTypes)];
            $qty = max(1, min((int) $order->quantity, rand(1, 2)));
            $refundAmount = round($order->line_total, 2);
            $createdAt = \Illuminate\Support\Carbon::parse($order->created_at ?: $now)->subDays(rand(0, 20));

            $returnId = DB::table('return_requests')->insertGetId([
                'uuid' => (string) Str::uuid(),
                'return_number' => 'RET-' . $createdAt->format('Y') . '-' . strtoupper(Str::random(8)),
                'user_id' => $order->user_id,
                'order_id' => $order->order_id,
                'vendor_order_id' => $order->vo_id,
                'order_item_id' => $order->item_id,
                'store_id' => $order->store_id,
                'vendor_id' => $order->vendor_id,
                'reason_type' => $returnType,
                'reason' => $returnReasons[$returnType],
                'quantity' => $qty,
                'refund_amount' => $refundAmount,
                'status' => $status,
                'review_notes' => in_array($status, ['requested', 'under_review']) ? null : 'Reviewed against order and delivery records.',
                'reviewed_by' => in_array($status, ['requested', 'under_review']) ? null : $adminId,
                'reviewed_at' => in_array($status, ['requested', 'under_review']) ? null : $createdAt->copy()->addDay(),
                'window_expires_at' => $createdAt->copy()->addDays(7),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            if (in_array($status, ['approved', 'collected', 'completed'])) {
                $createdReturnIds[$order->order_id] = $returnId;
            }
        }

        // ---------- REFUNDS ----------
        $refundStatuses = ['requested', 'requested', 'requested', 'approved', 'processing', 'refunded', 'refunded', 'failed', 'cancelled'];
        $refundReasons = [
            'Buyer return approved; refunding the item amount as requested.',
            'Gateway reversal after return quality inspection.',
            'Partial refund issued for the damaged package.',
            'Refund request auto-approved after pickup confirmation.',
            'Buyer requested cancellation of payment after failed delivery.',
        ];

        foreach ($sample->take($refundsSeed) as $idx => $order) {
            $status = $refundStatuses[$idx % count($refundStatuses)];

            $paymentId = DB::table('payments')->where('order_id', $order->order_id)->value('id');
            if (! $paymentId) {
                if (isset($createdPayments[$order->order_id])) {
                    $paymentId = $createdPayments[$order->order_id];
                } else {
                    $method = in_array($order->payment_method, ['esewa', 'khalti', 'fonepay', 'cod'])
                        ? $order->payment_method
                        : 'esewa';
                    $initiatedAt = \Illuminate\Support\Carbon::parse($order->created_at ?: $now)->subDays(rand(0, 25));
                    $paymentId = DB::table('payments')->insertGetId([
                        'uuid' => (string) Str::uuid(),
                        'payment_number' => 'PAY-' . $initiatedAt->format('Y') . '-' . strtoupper(Str::random(8)),
                        'order_id' => $order->order_id,
                        'vendor_order_id' => $order->vo_id,
                        'user_id' => $order->user_id,
                        'amount' => $order->grand_total,
                        'currency' => 'NPR',
                        'method' => $method,
                        'provider' => $providerMap[$method],
                        'status' => 'paid',
                        'provider_transaction_id' => 'TXN-' . strtoupper(Str::random(16)),
                        'payer_name' => null,
                        'created_at' => $initiatedAt,
                        'updated_at' => $initiatedAt,
                        'initiated_at' => $initiatedAt,
                        'verified_at' => $initiatedAt->copy()->addMinutes(5),
                    ]);
                    $createdPayments[$order->order_id] = $paymentId;
                }
            }

            $amount = round(min((float) $order->grand_total, (float) $order->line_total), 2);
            $createdAt = \Illuminate\Support\Carbon::parse($order->created_at ?: $now)->subDays(rand(0, 18));
            $returnRequestId = $createdReturnIds[$order->order_id] ?? null;
            $isDone = in_array($status, ['refunded', 'failed', 'cancelled']);

            DB::table('refunds')->insert([
                'uuid' => (string) Str::uuid(),
                'refund_number' => 'REF-' . $createdAt->format('Y') . '-' . strtoupper(Str::random(8)),
                'payment_id' => $paymentId,
                'order_id' => $order->order_id,
                'vendor_order_id' => $order->vo_id,
                'order_item_id' => $order->item_id,
                'return_request_id' => $returnRequestId,
                'amount' => $amount,
                'reason' => $refundReasons[array_rand($refundReasons)],
                'status' => $status,
                'provider_refund_id' => $status === 'refunded' ? 'PRF-' . strtoupper(Str::random(16)) : null,
                'initiated_by' => $adminId,
                'initiated_at' => $createdAt,
                'completed_at' => $isDone ? $createdAt->copy()->addHours(rand(2, 48)) : null,
                'created_at' => $createdAt,
                'updated_at' => $isDone ? $createdAt->copy()->addHours(rand(2, 48)) : $createdAt,
            ]);
        }

        $this->command->info('  → Done. Returns & Refunds now have demo records to test both pages.');
    }
}