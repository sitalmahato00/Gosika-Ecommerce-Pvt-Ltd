<?php

namespace App\Modules\Catalog\Presentation\Http\Controllers;

use App\Modules\Catalog\Presentation\Resources\VendorCustomerResource;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class VendorCustomerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('order_items.vendor_id', $vendor->id)
            ->select(
                'orders.user_id',
                DB::raw('count(distinct orders.id) as orders_count'),
                DB::raw('sum(order_items.line_total) as total_spent'),
                DB::raw('max(orders.placed_at) as last_order_at')
            )
            ->groupBy('orders.user_id')
            ->orderByDesc('total_spent')
            ->limit(500)
            ->get();

        $users = User::query()->whereIn('id', $rows->pluck('user_id'))->get()->keyBy('id');

        $customers = $rows
            ->filter(fn ($row) => $users->has($row->user_id))
            ->map(fn ($row) => (object) [
                'user' => $users->get($row->user_id),
                'orders_count' => $row->orders_count,
                'total_spent' => $row->total_spent,
                'last_order_at' => $row->last_order_at,
            ])
            ->values();

        $perPage = $request->integer('per_page', 15);
        $page = $request->integer('page', 1);

        $paginator = new LengthAwarePaginator(
            $customers->forPage($page, $perPage),
            $customers->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Response::success(
            VendorCustomerResource::collection($paginator->getCollection()),
            'Customers retrieved.',
            ['pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ]]
        );
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to view customers.', 403);
        }

        return $vendor;
    }
}
