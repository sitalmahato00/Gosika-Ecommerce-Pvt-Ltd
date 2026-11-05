<?php

namespace App\Modules\Catalog\Presentation\Http\Controllers;

use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Presentation\Resources\BrandResource;
use App\Modules\Catalog\Presentation\Resources\CategoryResource;
use App\Modules\Catalog\Presentation\Resources\ProductResource;
use App\Modules\Marketplace\Application\Services\MarketplaceService;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StockStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PublicCatalogController extends Controller
{
    public function categories(Request $request): JsonResponse
    {
        $withChildren = $request->boolean('with_children');
        $cacheKey = 'catalog.categories.public.'.($withChildren ? '1' : '0');

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
        $priceRanges = [
            'under_1000' => [0, 1000],
            '1000_5000' => [1000, 5000],
            '5000_15000' => [5000, 15000],
            '15000_50000' => [15000, 50000],
            'above_50000' => [50000, 10000000],
        ];
        $filterRules = [
            'price_ranges' => ['sometimes', 'array'],
            'price_ranges.*' => ['string', Rule::in(array_keys($priceRanges))],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0'],
            'min_rating' => ['sometimes'],
            'min_rating.*' => ['numeric', 'min:0', 'max:5'],
            'availability' => ['sometimes', 'array'],
            'availability.*' => ['string', Rule::in(array_column(StockStatus::cases(), 'value'))],
        ];
        foreach (['category', 'brand'] as $identifierFilter) {
            if (is_array($request->input($identifierFilter))) {
                $filterRules[$identifierFilter] = ['array'];
                $filterRules[$identifierFilter.'.*'] = ['string', 'max:255'];
            } elseif ($request->has($identifierFilter)) {
                $filterRules[$identifierFilter] = ['string', 'max:255'];
            }
        }
        if (is_array($request->input('min_rating'))) {
            $filterRules['min_rating'] = ['array'];
        } elseif ($request->has('min_rating')) {
            $filterRules['min_rating'] = ['numeric', 'min:0', 'max:5'];
        }
        if ($request->filled('min_price') && $request->filled('max_price')) {
            $filterRules['max_price'][] = 'gte:min_price';
        }
        $request->validate($filterRules);

        $categoryIdentifiers = $this->filterValues($request->input('category'));
        $brandIdentifiers = $this->filterValues($request->input('brand'));
        $selectedPriceRanges = $this->filterValues($request->input('price_ranges'));
        $minRatings = $this->filterValues($request->input('min_rating'));
        $availability = $this->filterValues($request->input('availability'));
        if ($availability === [] && $request->boolean('in_stock')) {
            $availability = [StockStatus::IN_STOCK->value, StockStatus::LOW_STOCK->value];
        }

        $coordinates = $this->searchCoordinates($request);
        $categoryIds = [];
        foreach ($categoryIdentifiers as $identifier) {
            $categoryIds = array_merge($categoryIds, $this->categoryAndDescendantIds($identifier));
        }
        $categoryIds = array_values(array_unique($categoryIds));
        $hasCustomPrice = $request->filled('min_price') || $request->filled('max_price');

        $products = Product::query()
            ->select('products.*')
            ->where('products.status', ProductStatus::PUBLISHED)
            ->whereHas('store', fn ($query) => $query->where('status', StoreStatus::ACTIVE))
            ->when(
                $availability === [],
                fn ($query) => $query->where('stock_status', '!=', StockStatus::OUT_OF_STOCK),
                fn ($query) => $query->whereIn('stock_status', $availability)
            )
            ->with([
                'store.addresses.municipality',
                'store.addresses.district',
                'store.addresses.province',
                'brand',
                'primaryImage',
                'variants' => fn ($q) => $q->orderBy('is_default', 'desc'),
            ])
            ->when($categoryIdentifiers !== [], fn ($q) => $q->whereIn('category_id', $categoryIds))
            ->when($brandIdentifiers !== [], fn ($q) => $q->whereHas('brand', function ($q) use ($brandIdentifiers) {
                $q->whereIn('slug', $brandIdentifiers)->orWhereIn('uuid', $brandIdentifiers);
            }))
            ->when($request->filled('store'), fn ($q) => $q->whereHas('store', fn ($q) => $q->where('uuid', $request->store)))
            ->when($selectedPriceRanges !== [] || $hasCustomPrice, function ($query) use ($selectedPriceRanges, $priceRanges, $request) {
                $query->where(function ($query) use ($selectedPriceRanges, $priceRanges, $request) {
                    foreach ($selectedPriceRanges as $range) {
                        [$min, $max] = $priceRanges[$range];
                        $query->orWhere(fn ($query) => $query->where('price', '>=', $min)->where('price', '<=', $max));
                    }

                    if ($request->filled('min_price') || $request->filled('max_price')) {
                        $query->orWhere(function ($query) use ($request) {
                            if ($request->filled('min_price')) {
                                $query->where('price', '>=', $request->input('min_price'));
                            }
                            if ($request->filled('max_price')) {
                                $query->where('price', '<=', $request->input('max_price'));
                            }
                        });
                    }
                });
            })
            ->when($minRatings !== [], function ($query) use ($minRatings) {
                $query->where(function ($query) use ($minRatings) {
                    foreach ($minRatings as $rating) {
                        $query->orWhere('rating_avg', '>=', $rating);
                    }
                });
            })
            ->when($request->filled('search'), function ($q) use ($request) {
                $q->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%'.$request->search.'%')
                        ->orWhere('description', 'like', '%'.$request->search.'%')
                        ->orWhereHas('brand', fn ($brand) => $brand->where('name', 'like', '%'.$request->search.'%'))
                        ->orWhereHas('category', fn ($category) => $category->where('name', 'like', '%'.$request->search.'%'));
                });
            })
            ->when($request->boolean('featured') || $request->boolean('is_featured'), fn ($q) => $q->where('is_featured', true))
            ->when($request->boolean('discount'), fn ($q) => $q->whereColumn('compare_at_price', '>', 'price'))
            ->when($coordinates !== null, function ($query) use ($coordinates) {
                $query->selectSub($this->distanceSubquery(...$coordinates), 'distance_score')
                    ->orderByRaw('CASE WHEN distance_score IS NULL THEN 1 ELSE 0 END')
                    ->orderBy('distance_score');
            });

        $sort = $request->input('sort');
        if ($sort) {
            match ($sort) {
                'price_asc' => $products->orderBy('price'),
                'price_desc' => $products->orderByDesc('price'),
                'newest' => $products->orderByDesc('created_at'),
                'rating' => $products->orderByDesc('rating_avg')->orderByDesc('rating_count'),
                'top' => $products->orderByDesc('rating_avg')->orderByDesc('views_count'),
                'discount' => $products->orderByDesc(DB::raw('(COALESCE(compare_at_price, price) - price)')),
                default => $products->orderByDesc('created_at'),
            };
        } elseif ($request->filled('search')) {
            $products->orderByDesc('rating_avg')->orderByDesc('rating_count')->orderByDesc('created_at');
        } else {
            $products->orderByDesc('created_at');
        }

        $products = $products->paginate((int) $request->integer('per_page', 12));

        return Response::success(
            ProductResource::collection($products),
            'Products retrieved.',
            $this->paginatorMeta($products)
        );
    }

    private function filterValues(mixed $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        return array_values(array_unique(array_filter(
            array_map(static fn ($item) => is_scalar($item) ? (string) $item : '', is_array($value) ? $value : [$value]),
            static fn ($item) => $item !== ''
        )));
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
            app(MarketplaceService::class)
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
        $coordinates = $this->searchCoordinates($request);
        $locationKey = $coordinates
            ? implode(',', array_map(fn ($coordinate) => round($coordinate, 3), $coordinates))
            : 'all';
        $cacheKey = 'search.suggestions.'.md5($q.'|'.$locationKey);

        $data = Cache::remember($cacheKey, 60, function () use ($q, $coordinates) {
            $results = [];

            // Products — exact and prefix matches first, then nearby and highly rated.
            $products = Product::query()
                ->available()
                ->where('name', 'like', '%'.$q.'%')
                ->with([
                    'primaryImage',
                    'store.addresses.municipality',
                    'store.addresses.district',
                    'store.addresses.province',
                ])
                ->select(['id', 'uuid', 'name', 'slug', 'store_id', 'rating_avg', 'rating_count'])
                ->when($coordinates !== null, fn ($query) => $query->selectSub(
                    $this->distanceSubquery(...$coordinates),
                    'distance_score'
                ))
                ->orderByRaw('CASE WHEN name = ? THEN 0 WHEN name LIKE ? THEN 1 ELSE 2 END', [$q, $q.'%'])
                ->when($coordinates !== null, fn ($query) => $query->orderBy('distance_score'))
                ->orderByDesc('rating_avg')
                ->orderByDesc('rating_count')
                ->limit(4)
                ->get();

            foreach ($products as $product) {
                $address = $product->store?->addresses->first();
                $location = $address?->municipality?->name
                    ?? $address?->district?->name
                    ?? $address?->province?->name;

                $results[] = [
                    'type' => 'product',
                    'id' => $product->uuid,
                    'label' => $product->name,
                    'slug' => $product->slug,
                    'image' => $product->primaryImage?->file_path ?? null,
                    'rating_avg' => $product->rating_avg,
                    'rating_count' => $product->rating_count,
                    'store_name' => $product->store?->name,
                    'location' => $location,
                ];
            }

            // Categories — up to 2
            $categories = Category::query()
                ->active()
                ->where('name', 'like', '%'.$q.'%')
                ->select(['id', 'name', 'slug', 'image'])
                ->orderBy('name')
                ->limit(2)
                ->get();

            foreach ($categories as $category) {
                $results[] = [
                    'type' => 'category',
                    'label' => $category->name,
                    'slug' => $category->slug,
                    'image' => $category->image ?? null,
                ];
            }

            // Brands — up to 2
            $brands = Brand::query()
                ->active()
                ->where('name', 'like', '%'.$q.'%')
                ->select(['id', 'name', 'slug', 'logo'])
                ->orderBy('name')
                ->limit(2)
                ->get();

            foreach ($brands as $brand) {
                $results[] = [
                    'type' => 'brand',
                    'label' => $brand->name,
                    'slug' => $brand->slug,
                    'image' => $brand->logo ?? null,
                ];
            }

            return $results;
        });

        return Response::success($data, 'Suggestions retrieved.');
    }

    /**
     * @return array{0: float, 1: float}|null
     */
    private function searchCoordinates(Request $request): ?array
    {
        $coordinates = $request->validate([
            'latitude' => ['nullable', 'required_with:longitude', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'required_with:latitude', 'numeric', 'between:-180,180'],
        ]);

        if (! isset($coordinates['latitude'], $coordinates['longitude'])) {
            return null;
        }

        return [(float) $coordinates['latitude'], (float) $coordinates['longitude']];
    }

    private function distanceSubquery(float $latitude, float $longitude)
    {
        $longitudeScale = cos(deg2rad($latitude));

        return DB::table('store_addresses')
            ->selectRaw(
                'MIN(
                    (CAST(latitude AS DECIMAL(10, 7)) - ?) * (CAST(latitude AS DECIMAL(10, 7)) - ?)
                    + (CAST(longitude AS DECIMAL(10, 7)) - ?) * (CAST(longitude AS DECIMAL(10, 7)) - ?) * ?
                )',
                [$latitude, $latitude, $longitude, $longitude, $longitudeScale * $longitudeScale]
            )
            ->whereColumn('store_addresses.store_id', 'products.store_id')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude');
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
