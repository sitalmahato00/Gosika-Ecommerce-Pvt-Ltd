<?php

namespace App\Modules\Catalog\Presentation\Http\Controllers;

use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Presentation\Resources\BrandResource;
use App\Modules\Catalog\Presentation\Resources\CategoryResource;
use App\Modules\Catalog\Presentation\Resources\ProductResource;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

class PublicCatalogController extends Controller
{
    public function categories(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->active()
            ->withCount(['products' => fn ($q) => $q->where('status', ProductStatus::PUBLISHED)])
            ->when($request->boolean('with_children'), fn ($q) => $q->with('children'))
            ->orderBy('sort_order')
            ->get();

        return Response::success(CategoryResource::collection($categories), 'Categories retrieved.');
    }

    public function brands(Request $request): JsonResponse
    {
        $brands = Brand::query()
            ->active()
            ->withCount(['products' => fn ($q) => $q->where('status', ProductStatus::PUBLISHED)])
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->search.'%'))
            ->orderBy('name')
            ->get();

        return Response::success(BrandResource::collection($brands), 'Brands retrieved.');
    }

    public function products(Request $request): JsonResponse
    {
        $products = Product::query()
            ->available()
            ->with(['store', 'brand', 'primaryImage', 'variants' => fn ($q) => $q->orderBy('is_default', 'desc')])
            ->when($request->filled('category'), fn ($q) => $q->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category)->orWhere('uuid', $request->category);
            }))
            ->when($request->filled('brand'), fn ($q) => $q->whereHas('brand', function ($q) use ($request) {
                $q->where('slug', $request->brand)->orWhere('uuid', $request->brand);
            }))
            ->when($request->filled('store'), fn ($q) => $q->whereHas('store', fn ($q) => $q->where('uuid', $request->store)))
            ->when($request->filled('min_price'), fn ($q) => $q->where('price', '>=', $request->min_price))
            ->when($request->filled('max_price'), fn ($q) => $q->where('price', '<=', $request->max_price))
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%'.$request->search.'%')
                        ->orWhere('description', 'like', '%'.$request->search.'%');
                });
            })
            ->when($request->boolean('featured'), fn ($q) => $q->where('is_featured', true))
            ->when($request->filled('sort'), function ($q) use ($request) {
                match ($request->sort) {
                    'price_asc' => $q->orderBy('price'),
                    'price_desc' => $q->orderByDesc('price'),
                    'newest' => $q->orderByDesc('created_at'),
                    'rating' => $q->orderByDesc('rating_avg'),
                    default => $q->orderByDesc('created_at'),
                };
            }, fn ($q) => $q->orderByDesc('created_at'))
            ->paginate((int) $request->integer('per_page', 12));

        return Response::success(
            ProductResource::collection($products),
            'Products retrieved.',
            $this->paginatorMeta($products)
        );
    }

    public function show(Request $request, string $productId): JsonResponse
    {
        $product = Product::query()
            ->available()
            ->with(['store', 'category', 'brand', 'images', 'variants' => fn ($q) => $q->with('attributeValues')])
            ->where('uuid', $productId)
            ->first();

        if (! $product) {
            return Response::error('Product not found.', [], 404);
        }

        $product->increment('views_count');

        if (Auth::guard('sanctum')->user()) {
            app(\App\Modules\Marketplace\Application\Services\MarketplaceService::class)
                ->trackRecentView(Auth::guard('sanctum')->user(), $product->uuid);
        }

        return Response::success(new ProductResource($product), 'Product retrieved.');
    }

    protected function paginatorMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];
    }
}
