<?php

use App\Modules\Marketing\Presentation\Http\Controllers\AdminBannerController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminCampaignController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminCmsPageController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminCouponController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminNotificationController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminNotificationFeedController;
use App\Modules\Marketing\Presentation\Http\Controllers\AdminPromotionController;
use App\Modules\Marketing\Presentation\Http\Controllers\PublicMarketingController;
use App\Modules\Marketing\Presentation\Http\Controllers\VendorCouponController;
use App\Modules\Marketing\Presentation\Http\Controllers\VendorNotificationController;
use App\Modules\Marketing\Presentation\Http\Controllers\VendorPromotionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('banners', [PublicMarketingController::class, 'banners']);
    Route::get('campaigns', [PublicMarketingController::class, 'campaigns']);
    Route::get('pages', [PublicMarketingController::class, 'pages']);
    Route::get('pages/{slug}', [PublicMarketingController::class, 'pageBySlug']);
});

Route::prefix('v1/admin')->middleware(['auth:sanctum', 'ensure:admin'])->group(function () {
    Route::get('coupons', [AdminCouponController::class, 'index']);
    Route::post('coupons', [AdminCouponController::class, 'store']);
    Route::put('coupons/{coupon}', [AdminCouponController::class, 'update']);
    Route::delete('coupons/{coupon}', [AdminCouponController::class, 'destroy']);

    Route::get('banners', [AdminBannerController::class, 'index']);
    Route::post('banners', [AdminBannerController::class, 'store']);
    Route::put('banners/{banner}', [AdminBannerController::class, 'update']);
    Route::delete('banners/{banner}', [AdminBannerController::class, 'destroy']);

    Route::get('campaigns', [AdminCampaignController::class, 'index']);
    Route::get('campaigns/stats', [AdminCampaignController::class, 'stats']);
    Route::get('campaigns/{campaign}', [AdminCampaignController::class, 'show']);
    Route::post('campaigns', [AdminCampaignController::class, 'store']);
    Route::put('campaigns/{campaign}', [AdminCampaignController::class, 'update']);
    Route::put('campaigns/{campaign}/status', [AdminCampaignController::class, 'updateStatus']);
    Route::delete('campaigns/{campaign}', [AdminCampaignController::class, 'destroy']);

    Route::get('promotions', [AdminPromotionController::class, 'index']);
    Route::get('promotions/stats', [AdminPromotionController::class, 'stats']);
    Route::put('promotions/{promotion}/status', [AdminPromotionController::class, 'updateStatus']);
    Route::delete('promotions/{promotion}', [AdminPromotionController::class, 'destroy']);

    Route::get('pages', [AdminCmsPageController::class, 'index']);
    Route::get('pages/stats', [AdminCmsPageController::class, 'stats']);
    Route::get('pages/{page}', [AdminCmsPageController::class, 'show']);
    Route::post('pages', [AdminCmsPageController::class, 'store']);
    Route::put('pages/{page}', [AdminCmsPageController::class, 'update']);
    Route::delete('pages/{page}', [AdminCmsPageController::class, 'destroy']);

    Route::get('notifications', [AdminNotificationController::class, 'index']);
    Route::post('notifications/send', [AdminNotificationController::class, 'send']);

    Route::get('notifications/feed', [AdminNotificationFeedController::class, 'index']);
    Route::get('notifications/feed/unread-count', [AdminNotificationFeedController::class, 'unread']);
    Route::post('notifications/feed/read-all', [AdminNotificationFeedController::class, 'markAllRead']);
    Route::post('notifications/feed/{notification}/read', [AdminNotificationFeedController::class, 'markRead']);
});

Route::prefix('v1/vendor')->middleware(['auth:sanctum', 'ensure:vendor'])->group(function () {
    Route::get('coupons', [VendorCouponController::class, 'index']);
    Route::post('coupons', [VendorCouponController::class, 'store']);
    Route::put('coupons/{coupon}', [VendorCouponController::class, 'update']);
    Route::delete('coupons/{coupon}', [VendorCouponController::class, 'destroy']);

    Route::get('promotions', [VendorPromotionController::class, 'index']);
    Route::post('promotions', [VendorPromotionController::class, 'store']);
    Route::put('promotions/{promotion}', [VendorPromotionController::class, 'update']);
    Route::delete('promotions/{promotion}', [VendorPromotionController::class, 'destroy']);

    Route::get('notifications', [VendorNotificationController::class, 'index']);
    Route::get('notifications/unread-count', [VendorNotificationController::class, 'unread']);
    Route::post('notifications/read-all', [VendorNotificationController::class, 'markAllRead']);
    Route::delete('notifications/read', [VendorNotificationController::class, 'clearRead']);
    Route::post('notifications/{notification}/read', [VendorNotificationController::class, 'markRead']);
});
