<?php

namespace App\Modules\Marketplace\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketplace\Infrastructure\Models\ProductReview;
use App\Modules\Marketplace\Infrastructure\Models\StoreReview;
use App\Modules\Marketplace\Presentation\Resources\AdminReviewResource;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;

class AdminReviewController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::PRODUCTS_APPROVE.'|'.Permissions::STORES_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $status = $request->input('status');
        $search = $request->input('search');
        $type = $request->input('type');
        $perPage = $request->integer('per_page', 15);

        $productQuery = ProductReview::query()->with(['user', 'product.primaryImage'])
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->when($search, fn ($q, $s) => $q->where('body', 'like', "%{$s}%"));

        $storeQuery = StoreReview::query()->with(['user', 'store'])
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->when($search, fn ($q, $s) => $q->where('body', 'like', "%{$s}%"));

        $productReviews = $productQuery->latest()->get()->each->setAttribute('review_type', 'product');
        $storeReviews = $storeQuery->latest()->get()->each->setAttribute('review_type', 'store');

        $reviews = new Collection();

        if (! $type || $type === 'product') {
            $reviews = $reviews->concat($productReviews);
        }

        if (! $type || $type === 'store') {
            $reviews = $reviews->concat($storeReviews);
        }

        $reviews = $reviews->sortByDesc('created_at')->values();

        $page = $request->integer('page', 1);
        $paginator = new LengthAwarePaginator(
            $reviews->forPage($page, $perPage),
            $reviews->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Response::success(
            AdminReviewResource::collection($paginator->getCollection()),
            'Reviews retrieved.',
            ['pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ]]
        );
    }

    public function approve(Request $request, string $type, string $reviewId): JsonResponse
    {
        $model = $this->resolve($type, $reviewId);
        $model->status = ReviewStatus::APPROVED;
        $model->reviewed_by = $request->user()->id;
        $model->reviewed_at = now();
        $model->save();

        app(AuditLogService::class)->record($request->user(), 'review.approved', 'review', $model->uuid, ['status' => 'pending'], ['status' => 'approved', 'type' => $type]);

        return Response::success(new AdminReviewResource($model->load(['user', 'product.primaryImage', 'store'])), 'Review approved.');
    }

    public function reject(Request $request, string $type, string $reviewId): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $model = $this->resolve($type, $reviewId);
        $model->status = ReviewStatus::REJECTED;
        $model->reviewed_by = $request->user()->id;
        $model->reviewed_at = now();
        $model->save();

        app(AuditLogService::class)->record($request->user(), 'review.rejected', 'review', $model->uuid, ['status' => 'pending'], ['status' => 'rejected', 'reason' => $request->input('reason'), 'type' => $type]);

        return Response::success(new AdminReviewResource($model->load(['user', 'product.primaryImage', 'store'])), 'Review rejected.');
    }

    public function destroy(Request $request, string $type, string $reviewId): JsonResponse
    {
        $model = $this->resolve($type, $reviewId);
        app(AuditLogService::class)->record($request->user(), 'review.deleted', 'review', $model->uuid, null, ['type' => $type]);
        $model->delete();

        return Response::success(null, 'Review deleted.');
    }

    protected function resolve(string $type, string $reviewId)
    {
        $model = $type === 'store'
            ? StoreReview::where('uuid', $reviewId)->first()
            : ProductReview::where('uuid', $reviewId)->first();

        if (! $model) {
            throw new DomainException('Review not found.', 404);
        }

        return $model;
    }
}
