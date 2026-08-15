<?php

use App\Modules\Shipping\Presentation\Http\Controllers\AdminDeliveryController;
use App\Modules\Shipping\Presentation\Http\Controllers\AdminShippingController;
use App\Modules\Shipping\Presentation\Http\Controllers\DeliveryPartnerController;
use App\Modules\Shipping\Presentation\Http\Controllers\DeliveryTrackingController;
use App\Modules\Shipping\Presentation\Http\Controllers\VendorDashboardController;
use App\Modules\Shipping\Presentation\Http\Controllers\VendorOrderController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/delivery-partner')->group(function () {
    Route::post('apply', [DeliveryPartnerController::class, 'apply']);
    Route::get('me', [DeliveryPartnerController::class, 'me']);
    Route::put('me', [DeliveryPartnerController::class, 'updateProfile']);
    Route::post('online', [DeliveryPartnerController::class, 'setOnline']);

    Route::get('assignments', [DeliveryPartnerController::class, 'assignments']);
    Route::get('assignments/{assignment}', [DeliveryPartnerController::class, 'assignment']);
    Route::post('assignments/{assignment}/accept', [DeliveryPartnerController::class, 'accept']);
    Route::post('assignments/{assignment}/pickup', [DeliveryPartnerController::class, 'pickup']);
    Route::post('assignments/{assignment}/out-for-delivery', [DeliveryPartnerController::class, 'outForDelivery']);
    Route::post('assignments/{assignment}/deliver', [DeliveryPartnerController::class, 'deliver']);
    Route::post('assignments/{assignment}/fail', [DeliveryPartnerController::class, 'fail']);
    Route::post('assignments/{assignment}/return', [DeliveryPartnerController::class, 'returnToVendor']);

    Route::get('history', [DeliveryPartnerController::class, 'history']);
});

Route::prefix('v1/admin/delivery-partners')->group(function () {
    Route::get('/', [AdminDeliveryController::class, 'partners']);
    Route::get('{partner}', [AdminDeliveryController::class, 'partner']);
    Route::post('{partner}/approve', [AdminDeliveryController::class, 'approve']);
    Route::post('{partner}/reject', [AdminDeliveryController::class, 'reject']);
    Route::post('{partner}/suspend', [AdminDeliveryController::class, 'suspend']);
    Route::post('{partner}/activate', [AdminDeliveryController::class, 'activate']);
});

Route::prefix('v1/admin/deliveries')->group(function () {
    Route::get('/', [AdminDeliveryController::class, 'assignments']);
    Route::post('/', [AdminDeliveryController::class, 'assign']);
    Route::get('{assignment}', [AdminDeliveryController::class, 'assignment']);
    Route::post('{assignment}/reassign', [AdminDeliveryController::class, 'reassign']);
});

Route::prefix('v1/vendor/orders')->group(function () {
    Route::get('/', [VendorOrderController::class, 'index']);
    Route::get('{vendorOrder}', [VendorOrderController::class, 'show']);
    Route::post('{vendorOrder}/accept', [VendorOrderController::class, 'accept']);
    Route::post('{vendorOrder}/reject', [VendorOrderController::class, 'reject']);
    Route::post('{vendorOrder}/ready-for-pickup', [VendorOrderController::class, 'readyForPickup']);
});

Route::prefix('v1/vendor')->group(function () {
    Route::get('dashboard', [VendorDashboardController::class, 'dashboard']);
});

Route::prefix('v1')->group(function () {
    Route::get('orders/{order}/tracking', [DeliveryTrackingController::class, 'orderTracking']);
});

Route::prefix('v1/admin/shipping')->group(function () {
    Route::get('zones', [AdminShippingController::class, 'zones']);
    Route::post('zones', [AdminShippingController::class, 'storeZone']);
    Route::put('zones/{zone}', [AdminShippingController::class, 'updateZone']);
    Route::delete('zones/{zone}', [AdminShippingController::class, 'deleteZone']);

    Route::get('couriers', [AdminShippingController::class, 'couriers']);
    Route::post('couriers', [AdminShippingController::class, 'storeCourier']);
    Route::put('couriers/{courier}', [AdminShippingController::class, 'updateCourier']);
    Route::delete('couriers/{courier}', [AdminShippingController::class, 'deleteCourier']);
});
