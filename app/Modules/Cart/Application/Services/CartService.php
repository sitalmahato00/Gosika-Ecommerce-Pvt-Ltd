<?php

namespace App\Modules\Cart\Application\Services;

use App\Modules\Cart\Infrastructure\Models\Cart;
use App\Modules\Cart\Infrastructure\Models\CartItem;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\ProductVariant;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StockStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Domain\Exceptions\InsufficientStockException;
use Illuminate\Support\Str;

class CartService
{
    public function getOrCreateCart(?User $user, ?string $sessionId = null): Cart
    {
        if ($user) {
            $cart = Cart::query()->active()->where('user_id', $user->id)->first();
            if ($cart) {
                return $cart;
            }

            $sessionCart = $sessionId ? Cart::query()->active()->where('session_id', $sessionId)->first() : null;

            $cart = new Cart();
            $cart->user_id = $user->id;
            $cart->status = 'active';
            $cart->save();

            if ($sessionCart && $sessionCart->items()->exists()) {
                $this->mergeCarts($sessionCart, $cart);
                $sessionCart->delete();
            }

            return $cart;
        }

        return Cart::query()->active()->where('session_id', $sessionId)->first()
            ?? tap(new Cart(), function (Cart $cart) use ($sessionId) {
                $cart->session_id = $sessionId ?: Str::uuid()->toString();
                $cart->status = 'active';
                $cart->save();
            });
    }

    public function getCart(?User $user, ?string $sessionId = null): Cart
    {
        if ($user) {
            return Cart::query()->active()->where('user_id', $user->id)
                ->with(['items' => fn ($q) => $q->with(['product.store', 'product.vendor', 'variant'])->orderByDesc('updated_at')])
                ->first() ?? $this->getOrCreateCart($user, $sessionId);
        }

        return Cart::query()->active()->where('session_id', $sessionId)
            ->with(['items' => fn ($q) => $q->with(['product.store', 'product.vendor', 'variant'])->orderByDesc('updated_at')])
            ->first() ?? $this->getOrCreateCart(null, $sessionId);
    }

    public function addItem(?User $user, ?string $sessionId, string $productId, ?string $variantId, int $quantity): CartItem
    {
        $cart = $this->getOrCreateCart($user, $sessionId);

        $product = $this->availableProduct($productId);
        $variant = $variantId ? $this->availableVariant($variantId, $product) : null;

        $available = $variant ? $variant->quantity : $product->quantity;
        $unitPrice = $variant ? $variant->price : $product->price;

        $existing = CartItem::query()
            ->where('cart_id', $cart->id)
            ->where('product_id', $product->id)
            ->where('variant_id', $variantId)
            ->first();

        $newQuantity = ($existing?->quantity ?? 0) + $quantity;

        if ($available !== null && $newQuantity > $available) {
            throw new InsufficientStockException('Only '.$available.' units available.');
        }

        if ($existing) {
            $existing->update([
                'quantity' => $newQuantity,
                'unit_price' => $unitPrice,
                'total_price' => $unitPrice * $newQuantity,
            ]);

            return $existing->refresh();
        }

        return CartItem::query()->create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'variant_id' => $variantId,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => $unitPrice * $quantity,
        ]);
    }

    public function updateQuantity(?User $user, ?string $sessionId, string $itemId, int $quantity): ?CartItem
    {
        $item = $this->ownedItem($user, $sessionId, $itemId);

        if (! $item) {
            return null;
        }

        if ($quantity <= 0) {
            $item->delete();

            return null;
        }

        $variant = $item->variant;
        $product = $item->product;
        $available = $variant ? $variant->quantity : $product?->quantity;

        if ($available !== null && $quantity > $available) {
            throw new InsufficientStockException('Only '.$available.' units available.');
        }

        $item->update([
            'quantity' => $quantity,
            'total_price' => $item->unit_price * $quantity,
        ]);

        return $item->refresh();
    }

    public function removeItem(?User $user, ?string $sessionId, string $itemId): bool
    {
        $item = $this->ownedItem($user, $sessionId, $itemId);

        if (! $item) {
            return false;
        }

        return (bool) $item->delete();
    }

    public function clear(?User $user, ?string $sessionId): bool
    {
        $cart = $this->getCart($user, $sessionId);

        return (bool) $cart->items()->delete();
    }

    public function count(?User $user, ?string $sessionId): int
    {
        $cart = $this->getCart($user, $sessionId);

        return (int) $cart->items()->sum('quantity');
    }

    protected function ownedItem(?User $user, ?string $sessionId, string $itemId): ?CartItem
    {
        $cart = $this->getCart($user, $sessionId);

        return CartItem::query()->where('cart_id', $cart->id)->where('uuid', $itemId)->first();
    }

    protected function availableProduct(string $productId): Product
    {
        $product = Product::query()->where('uuid', $productId)->where('status', ProductStatus::PUBLISHED)->first();

        if (! $product) {
            throw new DomainException('Product is not available.', 404);
        }

        return $product;
    }

    protected function availableVariant(string $variantId, Product $product): ProductVariant
    {
        $variant = ProductVariant::query()
            ->where('uuid', $variantId)
            ->where('product_id', $product->id)
            ->where('stock_status', '!=', StockStatus::OUT_OF_STOCK)
            ->first();

        if (! $variant) {
            throw new DomainException('Variant is not available.', 404);
        }

        return $variant;
    }

    protected function mergeCarts(Cart $from, Cart $to): void
    {
        foreach ($from->items as $item) {
            $existing = CartItem::query()
                ->where('cart_id', $to->id)
                ->where('product_id', $item->product_id)
                ->where('variant_id', $item->variant_id)
                ->first();

            if ($existing) {
                $existing->increment('quantity', $item->quantity);
                $existing->update(['total_price' => $existing->unit_price * $existing->quantity]);
            } else {
                $item->update(['cart_id' => $to->id]);
            }
        }
    }
}
