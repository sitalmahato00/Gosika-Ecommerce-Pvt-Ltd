<?php

use App\Modules\Marketplace\Presentation\Http\Controllers\MarketplaceController;
use App\Modules\Marketplace\Presentation\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/wishlist')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [WishlistController::class, 'index']);
    Route::post('/items', [WishlistController::class, 'add']);
    Route::delete('/items', [WishlistController::class, 'remove']);
    Route::get('/status/{product}', [WishlistController::class, 'status']);
});

Route::prefix('v1/marketplace')->group(function () {
    Route::get('stores', [MarketplaceController::class, 'stores']);
    Route::get('stores/{store}', [MarketplaceController::class, 'storeDetail']);
    Route::get('stores/{store}/products', [MarketplaceController::class, 'storeProducts']);
    Route::get('stores/{store}/reviews', [MarketplaceController::class, 'storeReviews']);

    Route::get('products/{product}/reviews', [MarketplaceController::class, 'productReviews']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('recently-viewed', [MarketplaceController::class, 'recentlyViewed']);
        Route::post('stores/{store}/reviews', [MarketplaceController::class, 'submitStoreReview']);
        Route::post('products/{product}/reviews', [MarketplaceController::class, 'submitProductReview']);
    });
});
