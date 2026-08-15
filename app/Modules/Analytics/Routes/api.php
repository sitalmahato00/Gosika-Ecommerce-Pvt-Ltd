<?php

use App\Modules\Analytics\Presentation\Http\Controllers\AdminAnalyticsController;
use App\Modules\Analytics\Presentation\Http\Controllers\VendorAnalyticsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin/analytics')->group(function () {
    Route::get('summary', [AdminAnalyticsController::class, 'summary']);
    Route::get('orders-by-status', [AdminAnalyticsController::class, 'ordersByStatus']);
    Route::get('payment-methods', [AdminAnalyticsController::class, 'paymentMethods']);
    Route::get('top-stores', [AdminAnalyticsController::class, 'topStores']);
    Route::get('category-share', [AdminAnalyticsController::class, 'categoryShare']);
    Route::get('provinces', [AdminAnalyticsController::class, 'provinceStats']);
});

Route::prefix('v1/vendor/analytics')->group(function () {
    Route::get('summary', [VendorAnalyticsController::class, 'summary']);
    Route::get('revenue-trend', [VendorAnalyticsController::class, 'revenueTrend']);
    Route::get('orders-by-status', [VendorAnalyticsController::class, 'ordersByStatus']);
    Route::get('top-products', [VendorAnalyticsController::class, 'topProducts']);
    Route::get('category-share', [VendorAnalyticsController::class, 'categoryShare']);
});
