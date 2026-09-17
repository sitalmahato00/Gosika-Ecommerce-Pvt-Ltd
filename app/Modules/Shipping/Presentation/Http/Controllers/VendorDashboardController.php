<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketplace\Infrastructure\Models\ProductReview;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Infrastructure\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class VendorDashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $range = $request->input('range', '30d');
        $from = $this->fromDate($range);

        $orders = VendorOrder::query()->where('vendor_id', $vendor->id);
        $rangeOrders = (clone $orders)->where('created_at', '>=', $from);

        $revenue = (float) (clone $rangeOrders)->whereNotIn('status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])->sum('grand_total');
        $commissionTotal = (float) (clone $rangeOrders)->whereNotIn('status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])->sum('commission_amount');
        $refundsTotal = (float) ReturnRequest::query()
            ->where('vendor_id', $vendor->id)
            ->where('created_at', '>=', $from)
            ->whereIn('status', [ReturnStatus::APPROVED->value, ReturnStatus::REFUNDED->value, ReturnStatus::COMPLETED->value])
            ->sum('refund_amount');
        $netEarnings = $revenue - $commissionTotal - $refundsTotal;
        $revenueDelta = $this->revenueDelta($vendor, $range, $revenue);

        $ordersCount = $orders->count();
        $readyToShip = (clone $orders)->where('status', OrderStatus::READY_FOR_PICKUP->value)->count();
        $lowStockCount = Product::query()->where('vendor_id', $vendor->id)->whereColumn('quantity', '<=', 'low_stock_threshold')->count();
        $pendingApprovals = Product::query()->where('vendor_id', $vendor->id)->where('status', ProductStatus::PENDING_REVIEW->value)->count();
        $returnsCount = ReturnRequest::query()->where('vendor_id', $vendor->id)->whereNotIn('status', [ReturnStatus::CANCELLED->value, ReturnStatus::REJECTED->value])->count();
        $returnsPending = ReturnRequest::query()
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', [ReturnStatus::REQUESTED->value, ReturnStatus::UNDER_REVIEW->value])
            ->count();
        $rtoCount = (clone $orders)->where('delivery_status', DeliveryStatus::RETURNED_TO_VENDOR->value)->count();

        $avgRating = ProductReview::query()
            ->whereHas('product', fn ($query) => $query->where('vendor_id', $vendor->id))
            ->where('status', ReviewStatus::APPROVED->value)
            ->avg('rating');

        $wallet = $vendor->wallet;

        $recentOrders = (clone $orders)
            ->with(['store', 'items', 'order.user', 'order.shippingAddress.municipality'])
            ->latest()
            ->limit(12)
            ->get()
            ->map(function (VendorOrder $order) {
                $snapshot = $order->order?->shipping_address_snapshot ?? [];
                $address = $order->order?->shippingAddress;
                $city = $snapshot['municipality']
                    ?? $snapshot['city']
                    ?? $snapshot['district']
                    ?? $address?->municipality?->name;

                return [
                    'id' => $order->uuid,
                    'order_number' => $order->order?->order_number,
                    'vendor_order_number' => $order->vendor_order_number,
                    'store_name' => $order->store?->name,
                    'customer' => $order->order?->user?->name
                        ?? $snapshot['full_name']
                        ?? $address?->full_name,
                    'city' => $city,
                    'product' => $order->items->first()?->product_name,
                    'amount' => number_format((float) $order->grand_total, 2, '.', ''),
                    'status' => $order->status->value,
                    'created_at' => $order->created_at?->toISOString(),
                ];
            });

        $recentTransactions = $wallet
            ? WalletTransaction::query()
                ->where('wallet_id', $wallet->id)
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (WalletTransaction $transaction) => [
                    'id' => $transaction->uuid,
                    'transaction_type' => $transaction->transaction_type->value,
                    'amount' => number_format((float) $transaction->amount, 2, '.', ''),
                    'balance_after' => number_format((float) $transaction->balance_after, 2, '.', ''),
                    'status' => $transaction->status,
                    'description' => $transaction->description,
                    'created_at' => $transaction->created_at?->toISOString(),
                ])
            : collect();

        $ordersByStatus = $orders
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($total, $status) => [
                'status' => $status,
                'count' => (int) $total,
            ])
            ->values();

        return Response::success([
            'range' => $range,
            'total_revenue' => number_format($revenue, 2, '.', ''),
            'net_earnings' => number_format($netEarnings, 2, '.', ''),
            'revenue_delta' => $revenueDelta,
            'orders_count' => $ordersCount,
            'ready_to_ship' => $readyToShip,
            'low_stock_count' => $lowStockCount,
            'pending_approvals' => $pendingApprovals,
            'returns_count' => $returnsCount + $rtoCount,
            'returns_pending' => $returnsPending,
            'rto_count' => $rtoCount,
            'avg_rating' => $avgRating !== null ? round((float) $avgRating, 2) : 0,
            'wallet' => $wallet ? [
                'balance' => number_format((float) $wallet->balance, 2, '.', ''),
                'available_balance' => number_format((float) $wallet->available_balance, 2, '.', ''),
                'pending_balance' => number_format((float) $wallet->pending_balance, 2, '.', ''),
            ] : [
                'balance' => '0.00',
                'available_balance' => '0.00',
                'pending_balance' => '0.00',
            ],
            'recent_orders' => $recentOrders,
            'recent_transactions' => $recentTransactions,
            'revenue_trend' => $this->revenueTrend($vendor, $range),
            'orders_by_status' => $ordersByStatus,
        ], 'Vendor dashboard retrieved.');
    }

    protected function revenueTrend(Vendor $vendor, string $range): array
    {
        [$start, $buckets] = $this->trendBuckets($range);

        $totals = [];
        $rows = VendorOrder::query()
            ->where('vendor_id', $vendor->id)
            ->where('created_at', '>=', $start)
            ->whereNotIn('status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])
            ->select('created_at', 'grand_total')
            ->get();

        foreach ($rows as $row) {
            $date = $row->created_at;
            $key = match ($range) {
                '90d' => $date->copy()->startOfWeek()->toDateString(),
                'year' => $date->format('Y-m'),
                default => $date->format('Y-m-d'),
            };
            $totals[$key] = ($totals[$key] ?? 0) + (float) $row->grand_total;
        }

        return array_map(fn (array $bucket) => [
            'label' => $bucket['label'],
            'value' => number_format($totals[$bucket['key']] ?? 0, 2, '.', ''),
        ], $buckets);
    }

    protected function trendBuckets(string $range): array
    {
        if ($range === 'year') {
            $start = now()->startOfYear();
            $buckets = [];

            for ($i = 0; $i < 12; $i++) {
                $date = $start->copy()->addMonths($i);
                $buckets[] = ['key' => $date->format('Y-m'), 'label' => $date->format('M')];
            }

            return [$start, $buckets];
        }

        if ($range === '90d') {
            $start = now()->startOfWeek()->subWeeks(11);
            $buckets = [];

            for ($i = 0; $i < 12; $i++) {
                $date = $start->copy()->addWeeks($i);
                $buckets[] = ['key' => $date->toDateString(), 'label' => 'W'.str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT)];
            }

            return [$start, $buckets];
        }

        $count = $range === '7d' ? 7 : 30;
        $start = now()->startOfDay()->subDays($count - 1);
        $buckets = [];

        for ($i = 0; $i < $count; $i++) {
            $date = $start->copy()->addDays($i);
            $buckets[] = ['key' => $date->format('Y-m-d'), 'label' => $date->format('D d')];
        }

        return [$start, $buckets];
    }

    protected function fromDate(string $range): \Illuminate\Support\Carbon
    {
        return match ($range) {
            '7d' => now()->subDays(7)->startOfDay(),
            '90d' => now()->subDays(90)->startOfDay(),
            'year' => now()->startOfYear(),
            default => now()->subDays(30)->startOfDay(),
        };
    }

    protected function revenueDelta(Vendor $vendor, string $range, float $current): float
    {
        $days = match ($range) {
            '7d' => 7,
            '90d' => 90,
            'year' => 365,
            default => 30,
        };

        $previousFrom = now()->subDays($days * 2)->startOfDay();
        $previousTo = now()->subDays($days)->startOfDay();

        $previous = (float) VendorOrder::query()
            ->where('vendor_id', $vendor->id)
            ->whereBetween('created_at', [$previousFrom, $previousTo])
            ->whereNotIn('status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])
            ->sum('grand_total');

        if ($previous <= 0) {
            return 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access the dashboard.', 403);
        }

        return $vendor;
    }
}