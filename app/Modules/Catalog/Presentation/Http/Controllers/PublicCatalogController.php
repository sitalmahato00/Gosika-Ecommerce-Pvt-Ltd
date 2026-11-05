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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PublicCatalogController extends Controller
{
    public function categories(Request $request): JsonResponse
    {
        $withChildren = $request->boolean('with_children');
        $cacheKey = 'catalog.categories.public.' . ($withChildren ? '1' : '0');

        $data = Cache::remember($cacheKey, 300, function () use ($withChildren) {
            $categories = Category::query()
                ->active()
                ->withCount(['products' => fn ($q) => $q->where('status', ProductStatus::PUBLISHED)])
                ->when($withChildren, fn ($q) => $q->with('children'))
                ->orderBy('sort_order')
                ->get();

            return CategoryResource::collection($categories)->resolve();
        });

        return Response::success($data, 'Categories retrieved.');
    }

    public function brands(Request $request): JsonResponse
    {
        $search = $request->input('search');
        if (empty($search)) {
            $data = Cache::remember('catalog.brands.public', 300, function () {
                $brands = Brand::query()
                    ->active()
                    ->withCount(['products' => fn ($q) => $q->where('status', ProductStatus::PUBLISHED)])
                    ->orderBy('name')
                    ->get();

                return BrandResource::collection($brands)->resolve();
            });
            return Response::success($data, 'Brands retrieved.');
        }

        $brands = Brand::query()
            ->active()
            ->withCount(['products' => fn ($q) => $q->where('status', ProductStatus::PUBLISHED)])
            ->where('name', 'like', '%'.$search.'%')
            ->orderBy('name')
            ->get();

        return Response::success(BrandResource::collection($brands), 'Brands retrieved.');
    }

    public function products(Request $request): JsonResponse
    {
        $categoryIds = $request->filled('category')
            ? $this->categoryAndDescendantIds((string) $request->input('category'))
            : [];

        $products = Product::query()
            ->available()
            ->with(['store', 'brand', 'primaryImage', 'variants' => fn ($q) => $q->orderBy('is_default', 'desc')])
            ->when($request->filled('category'), fn ($q) => $q->whereIn('category_id', $categoryIds))
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
            ->when($request->boolean('featured') || $request->boolean('is_featured'), fn ($q) => $q->where('is_featured', true))
            ->when($request->boolean('discount'), fn ($q) => $q->whereColumn('compare_at_price', '>', 'price'))
            ->when($request->filled('sort'), function ($q) use ($request) {
                match ($request->sort) {
                    'price_asc' => $q->orderBy('price'),
                    'price_desc' => $q->orderByDesc('price'),
                    'newest' => $q->orderByDesc('created_at'),
                    'rating' => $q->orderByDesc('rating_avg'),
                    'top' => $q->orderByDesc('rating_avg')->orderByDesc('views_count'),
                    'discount' => $q->orderByDesc(DB::raw('(COALESCE(compare_at_price, price) - price)')),
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

    protected function categoryAndDescendantIds(string $identifier): array
    {
        $category = Category::query()
            ->where('status', 'active')
            ->where(fn ($query) => $query->where('slug', $identifier)->orWhere('uuid', $identifier))
            ->first();

        if (! $category) {
            return [];
        }

        $ids = [$category->id];
        $frontier = $ids;

        while ($frontier !== []) {
            $frontier = Category::query()
                ->where('status', 'active')
                ->whereIn('parent_id', $frontier)
                ->whereNotIn('id', $ids)
                ->pluck('id')
                ->all();
            $ids = array_merge($ids, $frontier);
        }

        return $ids;
    }

    public function deals(Request $request): JsonResponse
    {
        $deals = Product::query()
            ->available()
            ->with(['store', 'brand', 'primaryImage', 'variants' => fn ($q) => $q->orderBy('is_default', 'desc')])
            ->whereColumn('compare_at_price', '>', 'price')
            ->when($request->filled('category'), fn ($q) => $q->whereHas('category', function ($q) use ($request) {
                $q->where('slug', $request->category)->orWhere('uuid', $request->category);
            }))
            ->orderByDesc(DB::raw('(COALESCE(compare_at_price, price) - price)'))
            ->paginate($request->integer('per_page', 12));

        return Response::success(ProductResource::collection($deals), 'Deals retrieved.', $this->paginatorMeta($deals));
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

    public function suggestions(Request $request): JsonResponse
    {
        $q = $request->input('q', '');

        // Return empty if query is missing or too short
        if (! is_string($q) || mb_strlen(trim($q)) < 2) {
            return Response::success([], 'Suggestions retrieved.');
        }

        $q = mb_substr(trim($q), 0, 100);
        $cacheKey = 'search.suggestions.' . md5($q);

        $data = Cache::remember($cacheKey, 60, function () use ($q) {
            $results = [];

            // Products — up to 4
            $products = Product::query()
                ->available()
                ->where('name', 'like', '%' . $q . '%')
                ->with('primaryImage')
                ->select(['id', 'name', 'slug'])
                ->orderBy('name')
                ->limit(4)
                ->get();

            foreach ($products as $product) {
                $results[] = [
                    'type'  => 'product',
                    'label' => $product->name,
                    'slug'  => $product->slug,
                    'image' => $product->primaryImage?->file_path ?? null,
                ];
            }

            // Categories — up to 2
            $categories = Category::query()
                ->active()
                ->where('name', 'like', '%' . $q . '%')
                ->select(['id', 'name', 'slug', 'image'])
                ->orderBy('name')
                ->limit(2)
                ->get();

            foreach ($categories as $category) {
                $results[] = [
                    'type'  => 'category',
                    'label' => $category->name,
                    'slug'  => $category->slug,
                    'image' => $category->image ?? null,
                ];
            }

            // Brands — up to 2
            $brands = Brand::query()
                ->active()
                ->where('name', 'like', '%' . $q . '%')
                ->select(['id', 'name', 'slug', 'logo'])
                ->orderBy('name')
                ->limit(2)
                ->get();

            foreach ($brands as $brand) {
                $results[] = [
                    'type'  => 'brand',
                    'label' => $brand->name,
                    'slug'  => $brand->slug,
                    'image' => $brand->logo ?? null,
                ];
            }

            return $results;
        });

        return Response::success($data, 'Suggestions retrieved.');
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
