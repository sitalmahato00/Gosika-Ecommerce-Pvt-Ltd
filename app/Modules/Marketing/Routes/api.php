<?php

use App\Modules\Marketing\Presentation\Http\Controllers\AdminBannerController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminCouponController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminNotificationController;
use App\Modules\Marketing\Presentation\Http\Controllers\VendorCouponController;
use App\Modules\Marketing\Presentation\Http\Controllers\VendorNotificationController;
use App\Modules\Marketing\Presentation\Http\Controllers\VendorPromotionController;
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

Route::prefix('v1/vendor')->group(function () {
    Route::get('coupons', [VendorCouponController::class, 'index']);
    Route::post('coupons', [VendorCouponController::class, 'store']);
    Route::put('coupons/{coupon}', [VendorCouponController::class, 'update']);
    Route::delete('coupons/{coupon}', [VendorCouponController::class, 'destroy']);

    Route::get('promotions', [VendorPromotionController::class, 'index']);
    Route::post('promotions', [VendorPromotionController::class, 'store']);
    Route::put('promotions/{promotion}', [VendorPromotionController::class, 'update']);
    Route::delete('promotions/{promotion}', [VendorPromotionController::class, 'destroy']);

    Route::get('notifications', [VendorNotificationController::class, 'index']);
    Route::post('notifications/read-all', [VendorNotificationController::class, 'markAllRead']);
    Route::delete('notifications/read', [VendorNotificationController::class, 'clearRead']);
    Route::post('notifications/{notification}/read', [VendorNotificationController::class, 'markRead']);
});
