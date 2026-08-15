<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketplace\Infrastructure\Models\ProductReview;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\OrderStatus;
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

        $orders = VendorOrder::query()->where('vendor_id', $vendor->id);

        $totalRevenue = (float) (clone $orders)->whereNotIn('status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])->sum('grand_total');
        $ordersCount = (clone $orders)->count();
        $pendingOrders = (clone $orders)->whereIn('status', [
            OrderStatus::PENDING->value,
            OrderStatus::PAYMENT_PENDING->value,
            OrderStatus::CONFIRMED->value,
            OrderStatus::ACCEPTED->value,
            OrderStatus::PROCESSING->value,
            OrderStatus::PREPARING->value,
            OrderStatus::READY_FOR_PICKUP->value,
        ])->count();
        $productsCount = Product::query()->where('vendor_id', $vendor->id)->count();
        $lowStockCount = Product::query()->where('vendor_id', $vendor->id)->whereColumn('quantity', '<=', 'low_stock_threshold')->count();

        $avgRating = ProductReview::query()
            ->whereHas('product', fn ($query) => $query->where('vendor_id', $vendor->id))
            ->where('status', ReviewStatus::APPROVED->value)
            ->avg('rating');

        $wallet = $vendor->wallet;

        $recentOrders = (clone $orders)
            ->with('store', 'items')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (VendorOrder $order) => [
                'id' => $order->uuid,
                'vendor_order_number' => $order->vendor_order_number,
                'store_name' => $order->store?->name,
                'status' => $order->status->value,
                'delivery_status' => $order->delivery_status->value,
                'grand_total' => number_format((float) $order->grand_total, 2, '.', ''),
                'created_at' => $order->created_at?->toISOString(),
            ]);

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
            'total_revenue' => number_format($totalRevenue, 2, '.', ''),
            'orders_count' => $ordersCount,
            'pending_orders' => $pendingOrders,
            'products_count' => $productsCount,
            'low_stock_count' => $lowStockCount,
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
            'revenue_14d' => $this->revenueForLastDays($vendor, 14),
            'orders_by_status' => $ordersByStatus,
        ], 'Vendor dashboard retrieved.');
    }

    protected function revenueForLastDays(Vendor $vendor, int $days): array
    {
        $start = now()->startOfDay()->subDays($days - 1);

        $totals = [];
        $rows = VendorOrder::query()
            ->where('vendor_id', $vendor->id)
            ->where('created_at', '>=', $start)
            ->whereNotIn('status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])
            ->select('created_at', 'grand_total')
            ->get();

        foreach ($rows as $row) {
            $key = $row->created_at->format('Y-m-d');
            $totals[$key] = ($totals[$key] ?? 0) + (float) $row->grand_total;
        }

        $data = [];

        for ($i = 0; $i < $days; $i++) {
            $date = $start->copy()->addDays($i);
            $data[] = [
                'label' => $date->format('D d'),
                'value' => number_format($totals[$date->format('Y-m-d')] ?? 0, 2, '.', ''),
            ];
        }

        return $data;
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
