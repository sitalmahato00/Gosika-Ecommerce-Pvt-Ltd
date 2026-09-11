<?php

namespace App\Modules\Customer\Presentation\Http\Controllers;

use App\Modules\Customer\Presentation\Resources\MyQuestionResource;
use App\Modules\Customer\Presentation\Resources\MyReviewResource;
use App\Modules\Customer\Presentation\Resources\CustomerStoreResource;
use App\Modules\Customer\Presentation\Resources\PendingReviewResource;
use App\Modules\Marketplace\Infrastructure\Models\ProductQuestion;
use App\Modules\Marketplace\Infrastructure\Models\ProductReview;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CustomerAccountController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function myReviews(Request $request): JsonResponse
    {
        $reviews = ProductReview::query()
            ->with(['product.primaryImage', 'orderItem'])
            ->where('user_id', $request->user()->id)
            ->when($request->filled('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest()
            ->paginate($request->integer('per_page', 12));

        return Response::success(
            MyReviewResource::collection($reviews),
            'My reviews retrieved.',
            ['pagination' => [
                'total' => $reviews->total(),
                'per_page' => $reviews->perPage(),
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
            ]]
        );
    }

    public function pendingReviews(Request $request): JsonResponse
    {
        $user = $request->user();
        $eligibleStatuses = [
            OrderStatus::CONFIRMED->value,
            OrderStatus::ACCEPTED->value,
            OrderStatus::PROCESSING->value,
            OrderStatus::PREPARING->value,
            OrderStatus::READY_FOR_PICKUP->value,
            OrderStatus::PICKED_UP->value,
            OrderStatus::OUT_FOR_DELIVERY->value,
            OrderStatus::DELIVERED->value,
            OrderStatus::COMPLETED->value,
            OrderStatus::RETURNED->value,
        ];

        $items = OrderItem::query()
            ->whereHas('order', function ($query) use ($user, $eligibleStatuses) {
                $query->where('user_id', $user->id)->whereIn('status', $eligibleStatuses);
            })
            ->whereNotNull('product_id')
            ->whereNotExists(function ($query) use ($user) {
                $query->selectRaw('1')
                    ->from('product_reviews')
                    ->whereColumn('product_reviews.vendor_order_item_id', 'order_items.id')
                    ->where('product_reviews.user_id', $user->id);
            })
            ->with(['product.primaryImage', 'order'])
            ->orderByDesc('order_items.created_at')
            ->paginate($request->integer('per_page', 12));

        return Response::success(
            PendingReviewResource::collection($items),
            'Pending reviews retrieved.',
            ['pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ]]
        );
    }

    public function myQuestions(Request $request): JsonResponse
    {
        $questions = ProductQuestion::query()
            ->with(['product.primaryImage'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->paginate($request->integer('per_page', 12));

        return Response::success(
            MyQuestionResource::collection($questions),
            'My questions retrieved.',
            ['pagination' => [
                'total' => $questions->total(),
                'per_page' => $questions->perPage(),
                'current_page' => $questions->currentPage(),
                'last_page' => $questions->lastPage(),
            ]]
        );
    }

    public function myStores(Request $request): JsonResponse
    {
        $user = $request->user();
        $eligibleStatuses = [
            OrderStatus::CONFIRMED->value,
            OrderStatus::ACCEPTED->value,
            OrderStatus::PROCESSING->value,
            OrderStatus::PREPARING->value,
            OrderStatus::READY_FOR_PICKUP->value,
            OrderStatus::PICKED_UP->value,
            OrderStatus::OUT_FOR_DELIVERY->value,
            OrderStatus::DELIVERED->value,
            OrderStatus::COMPLETED->value,
        ];

        $vendorIds = OrderItem::query()
            ->whereHas('order', function ($query) use ($user, $eligibleStatuses) {
                $query->where('user_id', $user->id)->whereIn('status', $eligibleStatuses);
            })
            ->whereNotNull('vendor_id')
            ->distinct()
            ->pluck('vendor_id');

        $stores = Store::query()
            ->whereIn('vendor_id', $vendorIds)
            ->withCount('products')
            ->latest('updated_at')
            ->paginate($request->integer('per_page', 12));

        return Response::success(
            CustomerStoreResource::collection($stores),
            'Followed stores retrieved.',
            ['pagination' => [
                'total' => $stores->total(),
                'per_page' => $stores->perPage(),
                'current_page' => $stores->currentPage(),
                'last_page' => $stores->lastPage(),
            ]]
        );
    }
}