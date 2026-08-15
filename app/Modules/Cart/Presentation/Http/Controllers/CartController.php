<?php

namespace App\Modules\Cart\Presentation\Http\Controllers;

use App\Modules\Cart\Application\Services\CartService;
use App\Modules\Cart\Presentation\Http\Requests\CartItemRequest;
use App\Modules\Cart\Presentation\Http\Requests\CartQuantityRequest;
use App\Modules\Cart\Presentation\Resources\CartResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function __construct(protected CartService $cartService)
    {
    }

    public function show(): JsonResponse
    {
        $cart = $this->cartService->getCart($this->user(), $this->sessionId());

        return Response::success(new CartResource($cart), 'Cart retrieved.');
    }

    public function store(CartItemRequest $request): JsonResponse
    {
        $item = $this->cartService->addItem(
            $this->user(),
            $this->sessionId(),
            $request->input('product_id'),
            $request->input('variant_id'),
            (int) $request->input('quantity', 1)
        );

        $cart = $this->cartService->getCart($this->user(), $this->sessionId());

        return Response::success([
            'item' => $item->uuid,
            'cart' => new CartResource($cart),
        ], 'Item added to cart.', ['session_id' => $this->sessionId()]);
    }

    public function update(CartQuantityRequest $request, string $item): JsonResponse
    {
        $item = $this->cartService->updateQuantity(
            $this->user(),
            $this->sessionId(),
            $item,
            (int) $request->input('quantity')
        );

        if (! $item) {
            return Response::error('Cart item not found.', [], 404);
        }

        $cart = $this->cartService->getCart($this->user(), $this->sessionId());

        return Response::success(new CartResource($cart), 'Cart updated.');
    }

    public function destroy(string $item): JsonResponse
    {
        $removed = $this->cartService->removeItem($this->user(), $this->sessionId(), $item);

        if (! $removed) {
            return Response::error('Cart item not found.', [], 404);
        }

        $cart = $this->cartService->getCart($this->user(), $this->sessionId());

        return Response::success(new CartResource($cart), 'Item removed from cart.');
    }

    public function clear(): JsonResponse
    {
        $this->cartService->clear($this->user(), $this->sessionId());

        return Response::success(null, 'Cart cleared.');
    }

    protected function sessionId(): ?string
    {
        $header = request()->header('X-Session-Id');

        return $header ?: null;
    }

    protected function user()
    {
        return Auth::guard('sanctum')->user();
    }
}
