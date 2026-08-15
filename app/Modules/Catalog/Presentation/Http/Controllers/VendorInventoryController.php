<?php

namespace App\Modules\Catalog\Presentation\Http\Controllers;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Presentation\Resources\VendorInventoryItemResource;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Enums\StockStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class VendorInventoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $products = Product::query()
            ->with(['category', 'primaryImage'])
            ->withSum('items as total_sold', 'quantity')
            ->where('vendor_id', $vendor->id)
            ->when($request->filled('search'), fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->input('search').'%')
                    ->orWhere('sku', 'like', '%'.$request->input('search').'%');
            }))
            ->when($request->filled('stock_status'), fn ($q) => $q->where('stock_status', $request->input('stock_status')))
            ->when($request->input('low_only'), fn ($q) => $q->whereColumn('quantity', '<=', 'low_stock_threshold'))
            ->latest('updated_at')
            ->paginate($request->integer('per_page', 100));

        return Response::success(
            VendorInventoryItemResource::collection($products),
            'Inventory retrieved.',
            [
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
            ]
        );
    }

    public function update(Request $request, string $productId): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $request->validate([
            'quantity' => ['nullable', 'integer', 'min:0'],
            'low_stock_threshold' => ['nullable', 'integer', 'min:0'],
        ]);

        $product = Product::query()
            ->where('uuid', $productId)
            ->where('vendor_id', $vendor->id)
            ->firstOrFail();

        if ($request->filled('quantity')) {
            $product->quantity = (int) $request->input('quantity');
        }

        if ($request->filled('low_stock_threshold')) {
            $product->low_stock_threshold = (int) $request->input('low_stock_threshold');
        }

        $product->stock_status = $product->quantity === 0
            ? StockStatus::OUT_OF_STOCK
            : ($product->quantity <= $product->low_stock_threshold
                ? StockStatus::LOW_STOCK
                : StockStatus::IN_STOCK);

        $product->save();

        return Response::success(
            new VendorInventoryItemResource($product->loadSum('items as total_sold', 'quantity')),
            'Inventory updated.'
        );
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to manage inventory.', 403);
        }

        return $vendor;
    }
}
