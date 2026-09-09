<?php

namespace App\Modules\Marketplace\Presentation\Http\Controllers;

use App\Modules\Catalog\Presentation\Resources\ProductResource;
use App\Modules\Marketplace\Application\Services\MarketplaceService;
use App\Modules\Marketplace\Presentation\Http\Requests\ProductReviewRequest;
use App\Modules\Marketplace\Presentation\Http\Requests\StoreReviewRequest;
use App\Modules\Marketplace\Presentation\Resources\ProductReviewResource;
use App\Modules\Marketplace\Presentation\Resources\ProductQuestionResource;
use App\Modules\Marketplace\Presentation\Resources\PublicStoreResource;
use App\Modules\Marketplace\Presentation\Resources\RecentlyViewedResource;
use App\Modules\Marketplace\Presentation\Resources\StoreReviewResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;

class MarketplaceController extends Controller
{
    public function __construct(protected MarketplaceService $marketplaceService)
    {
    }

    public function stores(Request $request): JsonResponse
    {
        $page = $request->integer('page', 1);
        $data = Cache::remember("marketplace.stores.p{$page}", 180, function () {
            $stores = $this->marketplaceService->storeList();
            return [
                'items' => PublicStoreResource::collection($stores)->resolve(),
                'meta' => $this->paginatorMeta($stores),
            ];
        });

        return Response::success(
            $data['items'],
            'Stores retrieved.',
            $data['meta']
        );
    }

    public function storeDetail(string $store): JsonResponse
    {
        $store = $this->marketplaceService->storeDetail($store);

        if (! $store) {
            return Response::error('Store not found.', [], 404);
        }

        return Response::success(new PublicStoreResource($store), 'Store retrieved.');
    }

    public function storeProducts(Request $request, string $store): JsonResponse
    {
        $products = $this->marketplaceService->storeProducts($store, $request->only(['search', 'category', 'sort', 'per_page']));

        return Response::success(
            ProductResource::collection($products),
            'Store products retrieved.',
            $this->paginatorMeta($products)
        );
    }

    public function recentlyViewed(): JsonResponse
    {
        $views = $this->marketplaceService->recentViews(request()->user());

        return Response::success(
            RecentlyViewedResource::collection($views),
            'Recently viewed products retrieved.',
            $this->paginatorMeta($views)
        );
    }

    public function productReviews(string $product): JsonResponse
    {
        $reviews = $this->marketplaceService->productReviews($product);

        return Response::success(
            ProductReviewResource::collection($reviews),
            'Product reviews retrieved.',
            $this->paginatorMeta($reviews)
        );
    }

    public function submitProductReview(ProductReviewRequest $request, string $product): JsonResponse
    {
        try {
            $review = $this->marketplaceService->submitProductReview(
                request()->user(),
                $product,
                $request->validated()
            );

            return Response::created(new ProductReviewResource($review), 'Review submitted for approval.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function storeReviews(string $store): JsonResponse
    {
        $reviews = $this->marketplaceService->storeReviews($store);

        return Response::success(
            StoreReviewResource::collection($reviews),
            'Store reviews retrieved.',
            $this->paginatorMeta($reviews)
        );
    }

    public function submitStoreReview(StoreReviewRequest $request, string $store): JsonResponse
    {
        try {
            $review = $this->marketplaceService->submitStoreReview(
                request()->user(),
                $store,
                $request->validated()
            );

            return Response::created(new StoreReviewResource($review), 'Review submitted for approval.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function productQuestions(string $product): JsonResponse
    {
        $questions = $this->marketplaceService->productQuestions($product);

        return Response::success(
            ProductQuestionResource::collection($questions),
            'Product questions retrieved.',
            $this->paginatorMeta($questions)
        );
    }

    public function submitProductQuestion(Request $request, string $product): JsonResponse
    {
        $validated = $request->validate([
            'question' => ['required', 'string', 'max:500'],
        ]);

        try {
            $question = $this->marketplaceService->submitProductQuestion(
                request()->user(),
                $product,
                $validated['question']
            );

            return Response::created(new ProductQuestionResource($question), 'Question submitted for review.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
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
