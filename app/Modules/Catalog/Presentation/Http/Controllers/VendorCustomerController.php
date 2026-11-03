<?php

namespace App\Modules\Catalog\Presentation\Http\Controllers;

use App\Modules\Catalog\Presentation\Resources\VendorCustomerResource;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Filters\ListingDateRange;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        $query = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('users', 'users.id', '=', 'orders.user_id')
            ->where('order_items.vendor_id', $vendor->id)
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%'.$request->string('search')->trim().'%';
                $query->where(function ($inner) use ($term) {
                    $inner->where('users.first_name', 'like', $term)
                        ->orWhere('users.last_name', 'like', $term)
                        ->orWhere('users.email', 'like', $term)
                        ->orWhere('users.phone', 'like', $term);
                });
            })
            ->select(
                'orders.user_id',
                DB::raw('count(distinct orders.id) as orders_count'),
                DB::raw('sum(order_items.line_total) as total_spent'),
                DB::raw('max(orders.placed_at) as last_order_at')
            )
            ->groupBy('orders.user_id')
            ->orderByDesc('total_spent');

        ListingDateRange::apply($query, $request, 'orders.placed_at');

        $perPage = min(max($request->integer('per_page', 15), 1), 100);
        $rows = $query->paginate($perPage)->withQueryString();
        $users = User::query()->whereIn('id', $rows->getCollection()->pluck('user_id'))->get()->keyBy('id');
        $customers = $rows->getCollection()
            ->filter(fn ($row) => $users->has($row->user_id))
            ->map(fn ($row) => (object) [
                'user' => $users->get($row->user_id),
                'orders_count' => $row->orders_count,
                'total_spent' => $row->total_spent,
                'last_order_at' => $row->last_order_at,
            ])
            ->values();

        $rows->setCollection($customers);

        return Response::success(
            VendorCustomerResource::collection($rows),
            'Customers retrieved.',
            ['pagination' => [
                'total' => $rows->total(),
                'per_page' => $rows->perPage(),
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
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
