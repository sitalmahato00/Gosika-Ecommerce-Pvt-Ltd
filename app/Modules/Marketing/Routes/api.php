<?php

use App\Modules\Marketing\Presentation\Http\Controllers\AdminBannerController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminCouponController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminNotificationController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin')->group(function () {
    Route::get('coupons', [AdminCouponController::class, 'index']);
    Route::post('coupons', [AdminCouponController::class, 'store']);
    Route::put('coupons/{coupon}', [AdminCouponController::class, 'update']);
    Route::delete('coupons/{coupon}', [AdminCouponController::class, 'destroy']);

    Route::get('banners', [AdminBannerController::class, 'index']);
    Route::post('banners', [AdminBannerController::class, 'store']);
    Route::put('banners/{banner}', [AdminBannerController::class, 'update']);
    Route::delete('banners/{banner}', [AdminBannerController::class, 'destroy']);

    Route::get('notifications', [AdminNotificationController::class, 'index']);
    Route::post('notifications/send', [AdminNotificationController::class, 'send']);
});
