<?php

namespace App\Modules\Marketplace\Presentation\Http\Controllers;

use App\Modules\Marketplace\Application\Services\WishlistService;
use App\Modules\Marketplace\Presentation\Http\Requests\WishlistItemRequest;
use App\Modules\Marketplace\Presentation\Resources\WishlistResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class WishlistController extends Controller
{
    public function __construct(protected WishlistService $wishlistService)
    {
    }

    public function index(): JsonResponse
    {
        $wishlist = $this->wishlistService->items(request()->user());

        return Response::success(new WishlistResource($wishlist), 'Wishlist retrieved.');
    }

    public function add(WishlistItemRequest $request): JsonResponse
    {
        $this->wishlistService->add(request()->user(), $request->input('product_id'));

        return Response::success([
            'wishlisted' => true,
        ], 'Added to wishlist.');
    }

    public function remove(WishlistItemRequest $request): JsonResponse
    {
        $removed = $this->wishlistService->remove(request()->user(), $request->input('product_id'));

        if (! $removed) {
            return Response::error('Product not in wishlist.', [], 404);
        }

        return Response::success([
            'wishlisted' => false,
        ], 'Removed from wishlist.');
    }

    public function status(string $productId): JsonResponse
    {
        return Response::success([
            'wishlisted' => $this->wishlistService->has(request()->user(), $productId),
        ], 'Wishlist status retrieved.');
    }
}
