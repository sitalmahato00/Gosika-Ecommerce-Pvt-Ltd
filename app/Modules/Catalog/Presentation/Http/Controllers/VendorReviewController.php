<?php

namespace App\Modules\Catalog\Presentation\Http\Controllers;

use App\Modules\Catalog\Presentation\Resources\VendorReviewResource;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketplace\Infrastructure\Models\ProductReview;
use App\Modules\Marketplace\Infrastructure\Models\StoreReview;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;

class VendorReviewController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $status = $request->input('status');
        $rating = $request->input('rating');
        $perPage = $request->integer('per_page', 15);

        $productReviews = ProductReview::query()
            ->with(['user', 'product.primaryImage'])
            ->whereHas('product', fn ($q) => $q->where('vendor_id', $vendor->id))
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->when($rating, fn ($q, $r) => $q->where('rating', $r))
            ->latest()
            ->get()
            ->each->setAttribute('review_type', 'product');

        $storeReviews = StoreReview::query()
            ->with(['user', 'store'])
            ->whereHas('store', fn ($q) => $q->where('vendor_id', $vendor->id))
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->when($rating, fn ($q, $r) => $q->where('rating', $r))
            ->latest()
            ->get()
            ->each->setAttribute('review_type', 'store');

        $reviews = (new Collection())
            ->concat($productReviews)
            ->concat($storeReviews)
            ->sortByDesc('created_at')
            ->values();

        $page = $request->integer('page', 1);
        $paginator = new LengthAwarePaginator(
            $reviews->forPage($page, $perPage),
            $reviews->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Response::success(
            VendorReviewResource::collection($paginator->getCollection()),
            'Reviews retrieved.',
            ['pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ]]
        );
    }

    public function reply(Request $request, string $type, string $reviewId): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $request->validate([
            'reply' => ['required', 'string', 'max:2000'],
        ]);

        if (! in_array($type, ['product', 'store'], true)) {
            throw new DomainException('Invalid review type.', 422);
        }

        $review = $type === 'product'
            ? ProductReview::query()
                ->where('uuid', $reviewId)
                ->whereHas('product', fn ($q) => $q->where('vendor_id', $vendor->id))
                ->first()
            : StoreReview::query()
                ->where('uuid', $reviewId)
                ->whereHas('store', fn ($q) => $q->where('vendor_id', $vendor->id))
                ->first();

        if (! $review) {
            throw new DomainException('Review not found.', 404);
        }

        $review->reply = $request->input('reply');
        $review->replied_by = $request->user()->id;
        $review->replied_at = now();
        $review->save();

        return Response::success(new VendorReviewResource($review), 'Reply posted.');
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to manage reviews.', 403);
        }

        return $vendor;
    }
}
