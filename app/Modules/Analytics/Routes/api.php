<?php

use App\Modules\Analytics\Presentation\Http\Controllers\AdminAnalyticsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin/analytics')->group(function () {
    Route::get('summary', [AdminAnalyticsController::class, 'summary']);
    Route::get('orders-by-status', [AdminAnalyticsController::class, 'ordersByStatus']);
    Route::get('payment-methods', [AdminAnalyticsController::class, 'paymentMethods']);
    Route::get('top-stores', [AdminAnalyticsController::class, 'topStores']);
    Route::get('category-share', [AdminAnalyticsController::class, 'categoryShare']);
    Route::get('provinces', [AdminAnalyticsController::class, 'provinceStats']);
});
