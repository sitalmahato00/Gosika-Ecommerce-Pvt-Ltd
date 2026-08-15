<?php

namespace App\Modules\Catalog\Presentation\Http\Controllers;

use App\Modules\Catalog\Application\Services\CatalogService;
use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\BrandRequest;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Presentation\Http\Requests\BrandReviewRequest;
use App\Modules\Catalog\Presentation\Http\Requests\ProductReviewRequest;
use App\Modules\Catalog\Presentation\Resources\BrandRequestResource;
use App\Modules\Catalog\Presentation\Resources\BrandResource;
use App\Modules\Catalog\Presentation\Resources\CategoryResource;
use App\Modules\Catalog\Presentation\Resources\ProductResource;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class AdminCatalogController extends Controller
{
    public function __construct(protected CatalogService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:products.approve|products.view|categories.manage|brands.manage');
    }

    public function pendingProducts(Request $request): JsonResponse
    {
        $products = Product::query()
            ->where('status', \App\Modules\Shared\Domain\Enums\ProductStatus::PENDING_REVIEW)
            ->with(['vendor', 'store', 'category', 'brand'])
            ->orderByDesc('created_at')
            ->paginate((int) $request->integer('per_page', 20));

        return Response::success(ProductResource::collection($products), 'Pending products retrieved.', [
            'current_page' => $products->currentPage(),
            'per_page' => $products->perPage(),
            'total' => $products->total(),
            'last_page' => $products->lastPage(),
        ]);
    }

    public function approveProduct(ProductReviewRequest $request, string $productId): JsonResponse
    {
        $this->authorize('products.approve');

        $product = $this->findProduct($productId);
        $product = $this->service->approveProduct($request->user(), $product);

        return Response::success(new ProductResource($product), 'Product approved and published.');
    }

    public function rejectProduct(ProductReviewRequest $request, string $productId): JsonResponse
    {
        $this->authorize('products.approve');

        $request->validate(['reason' => ['required', 'string', 'max:2000']]);

        $product = $this->findProduct($productId);
        $product = $this->service->rejectProduct($request->user(), $product, $request->input('reason'));

        return Response::success(new ProductResource($product), 'Product rejected.');
    }

    public function brandRequests(Request $request): JsonResponse
    {
        $brandRequests = BrandRequest::query()
            ->with(['vendor', 'brand'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at')
            ->paginate((int) $request->integer('per_page', 20));

        return Response::success(BrandRequestResource::collection($brandRequests), 'Brand requests retrieved.', [
            'current_page' => $brandRequests->currentPage(),
            'per_page' => $brandRequests->perPage(),
            'total' => $brandRequests->total(),
            'last_page' => $brandRequests->lastPage(),
        ]);
    }

    public function approveBrandRequest(BrandReviewRequest $request, string $brandRequestId): JsonResponse
    {
        $this->authorize('brands.manage');

        $brandRequest = $this->findBrandRequest($brandRequestId);
        $brandRequest = $this->service->approveBrandRequest($request->user(), $brandRequest);

        return Response::success(new BrandRequestResource($brandRequest), 'Brand request approved.');
    }

    public function rejectBrandRequest(BrandReviewRequest $request, string $brandRequestId): JsonResponse
    {
        $this->authorize('brands.manage');

        $request->validate(['reason' => ['required', 'string', 'max:2000']]);

        $brandRequest = $this->findBrandRequest($brandRequestId);
        $brandRequest = $this->service->rejectBrandRequest($request->user(), $brandRequest, $request->input('reason'));

        return Response::success(new BrandRequestResource($brandRequest), 'Brand request rejected.');
    }

    public function categories(Request $request): JsonResponse
    {
        $categories = Category::query()
            ->when($request->boolean('trashed'), fn ($q) => $q->onlyTrashed())
            ->when($request->boolean('with_children'), fn ($q) => $q->with('children'))
            ->withCount('products')
            ->orderBy('sort_order')
            ->get();

        return Response::success(CategoryResource::collection($categories), 'Categories retrieved.');
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $this->authorize('categories.manage');

        $validated = $request->validate([
            'parent_id' => ['nullable', 'string', 'exists:categories,uuid'],
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:170', 'regex:/^[a-z0-9-]+$/', 'unique:categories,slug'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = Category::query()->create([
            'parent_id' => isset($validated['parent_id']) ? Category::query()->where('uuid', $validated['parent_id'])->value('id') : null,
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'status' => 'active',
        ]);

        return Response::success(new CategoryResource($category), 'Category created.', [], 201);
    }

    public function updateCategory(Request $request, string $categoryId): JsonResponse
    {
        $this->authorize('categories.manage');

        $category = $this->findCategory($categoryId);

        $validated = $request->validate([
            'parent_id' => ['nullable', 'string', 'exists:categories,uuid'],
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:170', 'regex:/^[a-z0-9-]+$/', 'unique:categories,slug,'.$category->id],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category->update([
            'parent_id' => isset($validated['parent_id']) ? Category::query()->where('uuid', $validated['parent_id'])->value('id') : null,
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? $category->slug,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'status' => $validated['status'] ?? $category->status,
            'sort_order' => $validated['sort_order'] ?? $category->sort_order,
        ]);

        return Response::success(new CategoryResource($category), 'Category updated.');
    }

    public function deleteCategory(string $categoryId): JsonResponse
    {
        $this->authorize('categories.manage');

        $category = $this->findCategory($categoryId);
        $category->delete();

        return Response::success(null, 'Category deleted.');
    }

    public function brands(Request $request): JsonResponse
    {
        $brands = Brand::query()
            ->when($request->boolean('trashed'), fn ($q) => $q->onlyTrashed())
            ->withCount('products')
            ->orderBy('name')
            ->get();

        return Response::success(BrandResource::collection($brands), 'Brands retrieved.');
    }

    public function storeBrand(Request $request): JsonResponse
    {
        $this->authorize('brands.manage');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:170', 'regex:/^[a-z0-9-]+$/', 'unique:brands,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $brand = Brand::query()->create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'status' => 'active',
        ]);

        return Response::success(new BrandResource($brand), 'Brand created.', [], 201);
    }

    public function updateBrand(Request $request, string $brandId): JsonResponse
    {
        $this->authorize('brands.manage');

        $brand = $this->findBrand($brandId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:170', 'regex:/^[a-z0-9-]+$/', 'unique:brands,slug,'.$brand->id],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', 'string', 'in:active,inactive'],
        ]);

        $brand->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? $brand->slug,
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? $brand->status,
        ]);

        return Response::success(new BrandResource($brand), 'Brand updated.');
    }

    public function deleteBrand(string $brandId): JsonResponse
    {
        $this->authorize('brands.manage');

        $brand = $this->findBrand($brandId);
        $brand->delete();

        return Response::success(null, 'Brand deleted.');
    }

    protected function findProduct(string $productId): Product
    {
        $product = Product::query()->where('uuid', $productId)->first();

        if (! $product) {
            throw new DomainException('Product not found.', 404);
        }

        return $product;
    }

    protected function findBrandRequest(string $brandRequestId): BrandRequest
    {
        $brandRequest = BrandRequest::query()->where('uuid', $brandRequestId)->first();

        if (! $brandRequest) {
            throw new DomainException('Brand request not found.', 404);
        }

        return $brandRequest;
    }

    protected function findCategory(string $categoryId): Category
    {
        $category = Category::query()->where('uuid', $categoryId)->first();

        if (! $category) {
            throw new DomainException('Category not found.', 404);
        }

        return $category;
    }

    protected function findBrand(string $brandId): Brand
    {
        $brand = Brand::query()->where('uuid', $brandId)->first();

        if (! $brand) {
            throw new DomainException('Brand not found.', 404);
        }

        return $brand;
    }

    protected function authorize(string $permission): void
    {
        if (! auth()->user()->hasPermissionTo($permission)) {
            abort(403);
        }
    }
}
