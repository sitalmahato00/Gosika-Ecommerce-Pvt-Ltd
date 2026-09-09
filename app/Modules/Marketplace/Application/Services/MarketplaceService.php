<?php

namespace App\Modules\Marketplace\Application\Services;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketplace\Infrastructure\Models\ProductQuestion;
use App\Modules\Marketplace\Infrastructure\Models\ProductReview;
use App\Modules\Marketplace\Infrastructure\Models\RecentlyViewed;
use App\Modules\Marketplace\Infrastructure\Models\StoreReview;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Support\Facades\DB;

class MarketplaceService
{
    public function storeList(): object
    {
        return Store::query()
            ->where('status', \App\Modules\Shared\Domain\Enums\StoreStatus::ACTIVE)
            ->withCount(['products' => fn ($q) => $q->where('status', ProductStatus::PUBLISHED)])
            ->with([
                'addresses' => fn ($q) => $q->take(1),
                'reviews' => fn ($q) => $q->approved(),
            ])
            ->orderBy('name')
            ->paginate(12);
    }

    public function storeDetail(string $storeUuid): ?Store
    {
        return Store::query()
            ->where('status', \App\Modules\Shared\Domain\Enums\StoreStatus::ACTIVE)
            ->where('uuid', $storeUuid)
            ->withCount(['products' => fn ($q) => $q->where('status', ProductStatus::PUBLISHED)])
            ->with([
                'addresses',
                'operatingHours',
                'reviews' => fn ($q) => $q->approved(),
            ])
            ->first();
    }

    public function storeProducts(string $storeUuid, array $filters): object
    {
        return Product::query()
            ->where('status', ProductStatus::PUBLISHED)
            ->whereHas('store', fn ($q) => $q->where('uuid', $storeUuid))
            ->with(['primaryImage', 'brand'])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where('name', 'like', '%'.$s.'%'))
            ->when($filters['category'] ?? null, fn ($q, $c) => $q->whereHas('category', fn ($q) => $q->where('slug', $c)->orWhere('uuid', $c)))
            ->when($filters['sort'] ?? null, function ($q) use ($filters) {
                match ($filters['sort']) {
                    'price_asc' => $q->orderBy('price'),
                    'price_desc' => $q->orderByDesc('price'),
                    'newest' => $q->orderByDesc('created_at'),
                    'rating' => $q->orderByDesc('rating_avg'),
                    default => $q->orderByDesc('created_at'),
                };
            }, fn ($q) => $q->orderByDesc('created_at'))
            ->paginate((int) ($filters['per_page'] ?? 12));
    }

    public function trackRecentView(User $user, string $productUuid): void
    {
        $product = Product::query()->where('uuid', $productUuid)->first();

        if (! $product) {
            return;
        }

        RecentlyViewed::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->delete();

        RecentlyViewed::create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'viewed_at' => now(),
        ]);

        $keepIds = RecentlyViewed::query()
            ->where('user_id', $user->id)
            ->orderByDesc('viewed_at')
            ->limit(20)
            ->pluck('id');

        RecentlyViewed::query()
            ->where('user_id', $user->id)
            ->whereNotIn('id', $keepIds)
            ->delete();
    }

    public function recentViews(User $user): object
    {
        return RecentlyViewed::query()
            ->where('user_id', $user->id)
            ->with(['product.primaryImage', 'product.brand', 'product.store'])
            ->orderByDesc('viewed_at')
            ->paginate(12);
    }

    public function productReviews(string $productUuid): object
    {
        return ProductReview::query()
            ->approved()
            ->whereHas('product', fn ($q) => $q->where('uuid', $productUuid))
            ->with('user')
            ->orderByDesc('created_at')
            ->paginate(12);
    }

    public function storeReviews(string $storeUuid): object
    {
        return StoreReview::query()
            ->approved()
            ->whereHas('store', fn ($q) => $q->where('uuid', $storeUuid))
            ->with('user')
            ->orderByDesc('created_at')
            ->paginate(12);
    }

    public function submitProductReview(User $user, string $productUuid, array $data): ProductReview
    {
        $product = Product::query()->where('uuid', $productUuid)->first();

        if (! $product) {
            throw new DomainException('Product not found.', 404);
        }

        $orderItem = $this->purchasedOrderItem($user, $product);

        if (! $orderItem) {
            throw new DomainException('You can only review products you have purchased.', 403);
        }

        $exists = ProductReview::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->where('vendor_order_item_id', $orderItem->id)
            ->exists();

        if ($exists) {
            throw new DomainException('You have already reviewed this product.', 409);
        }

        return DB::transaction(function () use ($user, $product, $orderItem, $data) {
            $review = ProductReview::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'vendor_order_item_id' => $orderItem->id,
                'rating' => (int) $data['rating'],
                'title' => $data['title'] ?? null,
                'body' => $data['body'] ?? null,
                'status' => ReviewStatus::PENDING,
            ]);

            return $review->fresh();
        });
    }

    public function submitStoreReview(User $user, string $storeUuid, array $data): StoreReview
    {
        $store = Store::query()->where('uuid', $storeUuid)->first();

        if (! $store) {
            throw new DomainException('Store not found.', 404);
        }

        $vendorOrder = $this->purchasedVendorOrder($user, $store);

        if (! $vendorOrder) {
            throw new DomainException('You can only review stores you have ordered from.', 403);
        }

        $exists = StoreReview::query()
            ->where('user_id', $user->id)
            ->where('store_id', $store->id)
            ->where('vendor_order_id', $vendorOrder->id)
            ->exists();

        if ($exists) {
            throw new DomainException('You have already reviewed this store.', 409);
        }

        return DB::transaction(function () use ($user, $store, $vendorOrder, $data) {
            $review = StoreReview::create([
                'user_id' => $user->id,
                'store_id' => $store->id,
                'vendor_order_id' => $vendorOrder->id,
                'rating' => (int) $data['rating'],
                'body' => $data['body'] ?? null,
                'status' => ReviewStatus::PENDING,
            ]);

            return $review->fresh();
        });
    }

    public function productQuestions(string $productUuid): object
    {
        return ProductQuestion::query()
            ->approved()
            ->whereHas('product', fn ($q) => $q->where('uuid', $productUuid))
            ->with(['user', 'product.primaryImage'])
            ->orderByDesc('created_at')
            ->paginate(12);
    }

    public function submitProductQuestion(User $user, string $productUuid, string $question): ProductQuestion
    {
        $product = Product::query()->where('uuid', $productUuid)->first();

        if (! $product) {
            throw new DomainException('Product not found.', 404);
        }

        $open = ProductQuestion::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->whereIn('status', [ReviewStatus::PENDING, ReviewStatus::APPROVED])
            ->exists();

        if ($open) {
            throw new DomainException('You already have an open question about this product.', 409);
        }

        return ProductQuestion::create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'question' => $question,
            'status' => ReviewStatus::PENDING,
        ]);
    }

    protected function purchasedOrderItem(User $user, Product $product): ?OrderItem
    {
        return OrderItem::query()
            ->where('product_id', $product->id)
            ->whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->whereNotIn('status', [
                        OrderStatus::CANCELLED->value,
                        OrderStatus::FAILED->value,
                        OrderStatus::REJECTED->value,
                        OrderStatus::REFUNDED->value,
                        OrderStatus::RETURNED->value,
                    ]);
            })
            ->orderByDesc('id')
            ->first();
    }

    protected function purchasedVendorOrder(User $user, Store $store): ?VendorOrder
    {
        return VendorOrder::query()
            ->where('store_id', $store->id)
            ->whereHas('order', function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->whereNotIn('status', [
                        OrderStatus::CANCELLED->value,
                        OrderStatus::FAILED->value,
                        OrderStatus::REJECTED->value,
                        OrderStatus::REFUNDED->value,
                        OrderStatus::RETURNED->value,
                    ]);
            })
            ->orderByDesc('id')
            ->first();
    }
}
