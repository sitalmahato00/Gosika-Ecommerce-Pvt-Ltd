<?php

namespace App\Modules\Marketplace\Application\Services;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketplace\Infrastructure\Models\Wishlist;
use App\Modules\Marketplace\Infrastructure\Models\WishlistItem;
use Illuminate\Support\Facades\DB;

class WishlistService
{
    public function getOrCreateWishlist(User $user, ?string $name = null): Wishlist
    {
        return Wishlist::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['user_id' => $user->id, 'name' => $name ?: 'My Wishlist']
        );
    }

    public function items(User $user): Wishlist
    {
        return $this->getOrCreateWishlist($user)->load(['items.product.primaryImage']);
    }

    public function add(User $user, string $productUuid): WishlistItem
    {
        $wishlist = $this->getOrCreateWishlist($user);
        $product = Product::query()->where('uuid', $productUuid)->firstOrFail();

        return WishlistItem::query()->firstOrCreate([
            'wishlist_id' => $wishlist->id,
            'product_id' => $product->id,
        ]);
    }

    public function remove(User $user, string $productUuid): bool
    {
        $wishlist = $this->getOrCreateWishlist($user);
        $product = Product::query()->where('uuid', $productUuid)->first();

        if (! $product) {
            return false;
        }

        return (bool) WishlistItem::query()
            ->where('wishlist_id', $wishlist->id)
            ->where('product_id', $product->id)
            ->delete();
    }

    public function has(User $user, string $productUuid): bool
    {
        $wishlist = $this->getOrCreateWishlist($user);
        $product = Product::query()->where('uuid', $productUuid)->first();

        if (! $product) {
            return false;
        }

        return WishlistItem::query()
            ->where('wishlist_id', $wishlist->id)
            ->where('product_id', $product->id)
            ->exists();
    }

    public function toggle(User $user, string $productUuid): array
    {
        $added = $this->add($user, $productUuid);

        return ['added' => true, 'wishlisted' => $this->has($user, $productUuid)];
    }
}
