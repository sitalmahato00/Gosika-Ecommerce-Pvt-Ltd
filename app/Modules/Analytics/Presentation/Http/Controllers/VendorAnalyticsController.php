<?php

namespace App\Modules\Analytics\Presentation\Http\Controllers;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class VendorAnalyticsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function summary(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $from = $this->fromDate($request->input('range', '30d'));

        $orders = VendorOrder::query()->where('vendor_id', $vendor->id)->where('created_at', '>=', $from);

        $revenue = (float) (clone $orders)->whereNotIn('status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])->sum('grand_total');
        $ordersCount = (clone $orders)->count();
        $avgOrderValue = $ordersCount > 0 ? $revenue / $ordersCount : 0;
        $commissionTotal = (float) (clone $orders)->whereNotIn('status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])->sum('commission_amount');
        $deliveryFees = (float) (clone $orders)->sum('delivery_charge');
        $productsSold = (int) OrderItem::query()
            ->join('vendor_orders', 'vendor_orders.id', '=', 'order_items.vendor_order_id')
            ->where('order_items.vendor_id', $vendor->id)
            ->where('vendor_orders.created_at', '>=', $from)
            ->whereNotIn('vendor_orders.status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])
            ->sum('order_items.quantity');
        $refundsTotal = (float) ReturnRequest::query()
            ->where('vendor_id', $vendor->id)
            ->where('created_at', '>=', $from)
            ->whereIn('status', [ReturnStatus::APPROVED->value, ReturnStatus::REFUNDED->value, ReturnStatus::COMPLETED->value])
            ->sum('refund_amount');
        $netEarnings = $revenue - $commissionTotal - $refundsTotal;
        $orderCompleted = (clone $orders)->whereIn('status', [OrderStatus::COMPLETED->value, OrderStatus::DELIVERED->value])->count();

        return Response::success([
            'range' => $request->input('range', '30d'),
            'from' => $from->toISOString(),
            'revenue' => number_format($revenue, 2, '.', ''),
            'orders_count' => $ordersCount,
            'avg_order_value' => number_format($avgOrderValue, 2, '.', ''),
            'products_sold' => $productsSold,
            'commission_total' => number_format($commissionTotal, 2, '.', ''),
            'delivery_fees' => number_format($deliveryFees, 2, '.', ''),
            'refunds_total' => number_format($refundsTotal, 2, '.', ''),
            'net_earnings' => number_format($netEarnings, 2, '.', ''),
            'order_completed' => $orderCompleted,
        ], 'Analytics summary retrieved.');
    }

    public function revenueTrend(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $range = $request->input('range', '30d');

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

        $data = array_map(fn (array $bucket) => [
            'label' => $bucket['label'],
            'value' => number_format($totals[$bucket['key']] ?? 0, 2, '.', ''),
        ], $buckets);

        return Response::success($data, 'Revenue trend retrieved.');
    }

    public function ordersByStatus(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $from = $this->fromDate($request->input('range', '30d'));

        $rows = VendorOrder::query()
            ->where('vendor_id', $vendor->id)
            ->where('created_at', '>=', $from)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return Response::success($rows->map(fn ($total, $status) => [
            'status' => $status,
            'count' => (int) $total,
        ])->values(), 'Orders by status retrieved.');
    }

    public function topProducts(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $from = $this->fromDate($request->input('range', '30d'));

        $rows = OrderItem::query()
            ->join('vendor_orders', 'vendor_orders.id', '=', 'order_items.vendor_order_id')
            ->where('order_items.vendor_id', $vendor->id)
            ->where('vendor_orders.created_at', '>=', $from)
            ->whereNotIn('vendor_orders.status', [OrderStatus::CANCELLED->value, OrderStatus::FAILED->value])
            ->select(
                'order_items.product_id',
                'order_items.product_name',
                DB::raw('SUM(order_items.quantity) as units_sold'),
                DB::raw('SUM(order_items.line_total) as revenue')
            )
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('revenue')
            ->limit($request->integer('limit', 5))
            ->get();

        $products = Product::query()
            ->whereIn('id', $rows->pluck('product_id')->filter())
            ->with(['category', 'primaryImage'])
            ->get()
            ->keyBy('id');

        return Response::success($rows->map(function ($row) use ($products) {
            $product = $products->get($row->product_id);

            return [
                'id' => $product?->uuid,
                'name' => $row->product_name,
                'category' => $product?->category?->name,
                'units_sold' => (int) $row->units_sold,
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
                'image' => $product?->primaryImage?->file_path,
            ];
        }), 'Top products retrieved.');
    }

    public function categoryShare(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $from = $this->fromDate($request->input('range', '30d'));

        $rows = OrderItem::query()
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->join('vendor_orders', 'vendor_orders.id', '=', 'order_items.vendor_order_id')
            ->where('order_items.vendor_id', $vendor->id)
            ->where('vendor_orders.created_at', '>=', $from)
            ->select('categories.name as label', DB::raw('SUM(order_items.line_total) as revenue'))
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        return Response::success($rows->map(fn ($row) => [
            'label' => $row->label,
            'revenue' => number_format((float) $row->revenue, 2, '.', ''),
        ]), 'Category share retrieved.');
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

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access analytics.', 403);
        }

        return $vendor;
    }
}
