<?php

namespace App\Modules\Customer\Presentation\Http\Controllers;

use App\Modules\Customer\Infrastructure\Models\CustomerWallet;
use App\Modules\Customer\Infrastructure\Models\CustomerWalletTransaction;
use App\Modules\Customer\Presentation\Resources\AdminCustomerResource;
use App\Modules\Customer\Presentation\Resources\CustomerWalletResource;
use App\Modules\Customer\Presentation\Resources\CustomerWalletTransactionResource;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminCustomerController extends Controller
{
    private const SEGMENT_KEYS = ['all_customers', 'new_customers', 'active_buyers', 'repeat_buyers', 'high_value', 'at_risk'];

    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
        $this->middleware('permission:'.Permissions::USERS_VIEW);
    }

    private function customerBaseQuery()
    {
        return User::query()
            ->role(Roles::CUSTOMER)
            ->with('customerProfile')
            ->withCount('orders')
            ->withCount('addresses')
            ->withSum('orders as total_spend', 'grand_total')
            ->withMax('orders as last_order_at', 'placed_at');
    }

    public function index(Request $request): JsonResponse
    {
        $customers = $this->customerBaseQuery()
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            AdminCustomerResource::collection($customers),
            'Customers retrieved.',
            self::paginationMeta($customers)
        );
    }

    public function stats(): JsonResponse
    {
        $customerIds = User::query()->role(Roles::CUSTOMER)->pluck('id');

        $total = $customerIds->count();
        $active = User::query()->role(Roles::CUSTOMER)->where('status', UserStatus::ACTIVE)->count();
        $newThisMonth = User::query()->role(Roles::CUSTOMER)->where('created_at', '>=', now()->startOfMonth())->count();

        $orderAgg = Order::query()
            ->whereIn('user_id', $customerIds)
            ->whereNotIn('status', [OrderStatus::CANCELLED, OrderStatus::FAILED, OrderStatus::REFUNDED])
            ->selectRaw('COUNT(*) as total_orders, COALESCE(SUM(grand_total),0) as total_revenue')
            ->first();

        $totalOrders = (int) ($orderAgg?->total_orders ?? 0);
        $totalRevenue = (float) ($orderAgg?->total_revenue ?? 0);

        return Response::success([
            'total_customers' => $total,
            'active_customers' => $active,
            'inactive_customers' => max(0, $total - $active),
            'new_this_month' => $newThisMonth,
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'avg_order_value' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
            'wallet_balance' => (float) CustomerWallet::query()->sum('balance'),
            'wallet_customers' => CustomerWallet::query()->where('balance', '>', 0)->count(),
        ], 'Customer stats retrieved.');
    }

    public function segments(): JsonResponse
    {
        $base = User::query()->role(Roles::CUSTOMER);

        $segments = [
            'all_customers' => ['name' => 'All Customers', 'description' => 'Every registered customer on the platform.', 'criteria' => 'Role = customer', 'count' => (clone $base)->count(), 'color' => 'slate', 'icon' => 'users'],
            'new_customers' => ['name' => 'New Customers', 'description' => 'Customers who registered in the last 30 days.', 'criteria' => 'Registered ≤ 30 days ago', 'count' => (clone $base)->where('created_at', '>=', now()->subDays(30))->count(), 'color' => 'emerald', 'icon' => 'sparkles'],
            'active_buyers' => ['name' => 'Active Buyers', 'description' => 'Customers who placed at least one order in the last 90 days.', 'criteria' => '≥ 1 order in last 90 days', 'count' => $this->bySegmentQuery('active_buyers')->count(), 'color' => 'sky', 'icon' => 'shopping-bag'],
            'repeat_buyers' => ['name' => 'Repeat Buyers', 'description' => 'Customers with more than one valid order.', 'criteria' => '≥ 2 orders', 'count' => $this->bySegmentQuery('repeat_buyers')->count(), 'color' => 'indigo', 'icon' => 'refresh'],
            'high_value' => ['name' => 'High Value', 'description' => 'Customers whose total valid spend is NPR 20,000 or more.', 'criteria' => 'Total spend ≥ NPR 20,000', 'count' => $this->bySegmentQuery('high_value')->count(), 'color' => 'amber', 'icon' => 'trending-up'],
            'at_risk' => ['name' => 'At Risk', 'description' => 'Customers who ordered before but not in the last 90 days.', 'criteria' => 'Historic orders, none in 90 days', 'count' => $this->bySegmentQuery('at_risk')->count(), 'color' => 'rose', 'icon' => 'alert-triangle'],
        ];

        foreach ($segments as $key => $spec) {
            $segments[$key]['samples'] = $this->sampleOf($this->bySegmentQuery($key)->limit(5)->get(['uuid', 'first_name', 'last_name', 'email']));
        }

        return Response::success($segments, 'Customer segments retrieved.');
    }

    public function segmentMembers(Request $request, string $segment): JsonResponse
    {
        if (! in_array($segment, self::SEGMENT_KEYS, true)) {
            abort(404, 'Unknown segment.');
        }

        $members = $this->bySegmentQuery($segment)
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            AdminCustomerResource::collection($members),
            'Segment members retrieved.',
            self::paginationMeta($members)
        );
    }

    public function wallets(Request $request): JsonResponse
    {
        $wallets = CustomerWallet::query()
            ->with('user:id,first_name,last_name,email,phone,avatar,status')
            ->withSum('transactions as transactions_total', 'amount')
            ->withCount('transactions as transactions_count')
            ->when($request->input('search'), function ($q, $search) {
                $q->whereHas('user', fn ($u) => $u->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            })
            ->orderByDesc('balance')
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            CustomerWalletResource::collection($wallets),
            'Customer wallets retrieved.',
            self::paginationMeta($wallets)
        );
    }

    public function walletDetail(string $userUuid): JsonResponse
    {
        $wallet = CustomerWallet::query()
            ->with('user:id,first_name,last_name,email,phone,avatar,status')
            ->whereHas('user', fn ($q) => $q->where('uuid', $userUuid)->role(Roles::CUSTOMER))
            ->first();

        if (! $wallet) {
            return Response::success(['wallet' => null, 'transactions' => []], 'Customer wallet retrieved.');
        }

        $transactions = CustomerWalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->latest()
            ->paginate(20);

        return Response::success([
            'wallet' => new CustomerWalletResource($wallet),
            'transactions' => CustomerWalletTransactionResource::collection($transactions),
            'pagination' => self::paginationMeta($transactions)['pagination'],
        ], 'Customer wallet retrieved.');
    }

    public function walletTransactions(Request $request, string $userUuid): JsonResponse
    {
        $wallet = CustomerWallet::query()
            ->whereHas('user', fn ($q) => $q->where('uuid', $userUuid)->role(Roles::CUSTOMER))
            ->firstOrFail();

        $transactions = CustomerWalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return Response::success(
            CustomerWalletTransactionResource::collection($transactions),
            'Wallet transactions retrieved.',
            self::paginationMeta($transactions)
        );
    }

    private function bySegmentQuery(string $segment)
    {
        $base = User::query()->role(Roles::CUSTOMER)->with('customerProfile')
            ->withCount('orders')
            ->withCount('addresses')
            ->withSum('orders as total_spend', 'grand_total')
            ->withMax('orders as last_order_at', 'placed_at');

        if ($segment === 'new_customers') {
            return $base->where('created_at', '>=', now()->subDays(30));
        }

        if ($segment === 'all_customers') {
            return $base;
        }

        return $base->whereIn('id', $this->buyerIds($segment));
    }

    private function buyerIds(string $segment)
    {
        $valid = Order::query()
            ->select('user_id')
            ->whereNotIn('status', [OrderStatus::CANCELLED, OrderStatus::FAILED, OrderStatus::REFUNDED]);

        return match ($segment) {
            'active_buyers' => (clone $valid)->where('placed_at', '>=', now()->subDays(90))->distinct()->pluck('user_id'),
            'repeat_buyers' => (clone $valid)->groupBy('user_id')->havingRaw('COUNT(*) >= 2')->pluck('user_id'),
            'high_value' => (clone $valid)->groupBy('user_id')->havingRaw('COALESCE(SUM(grand_total),0) >= 20000')->pluck('user_id'),
            'at_risk' => (clone $valid)->groupBy('user_id')->havingRaw('MAX(placed_at) < ?', [now()->subDays(90)->toDateTimeString()])->pluck('user_id'),
            default => collect(),
        };
    }

    private function sampleOf($users): array
    {
        return $users->map(fn ($u) => ['id' => $u->uuid, 'name' => trim(($u->first_name ?? '').' '.($u->last_name ?? '')), 'email' => $u->email])->values()->all();
    }

    private static function paginationMeta($paginator): array
    {
        return ['pagination' => [
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
        ]];
    }
}