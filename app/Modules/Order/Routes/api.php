<?php

use App\Modules\Order\Presentation\Http\Controllers\AdminOrderController;
use App\Modules\Order\Presentation\Http\Controllers\CustomerReturnController;
use App\Modules\Order\Presentation\Http\Controllers\OrderController;
use App\Modules\Order\Presentation\Http\Controllers\VendorReturnController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/orders')->middleware(['auth:sanctum', 'throttle:auth'])->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/{order}', [OrderController::class, 'show']);
    Route::post('/{order}/cancel', [OrderController::class, 'cancel']);
});

Route::prefix('v1/admin/orders')->group(function () {
    Route::get('/', [AdminOrderController::class, 'index']);
    Route::get('/{order}', [AdminOrderController::class, 'show']);
    Route::post('/{order}/cancel', [AdminOrderController::class, 'cancel']);
});

Route::prefix('v1/vendor/returns')->group(function () {
    Route::get('/', [VendorReturnController::class, 'index']);
    Route::post('/{return}/status', [VendorReturnController::class, 'updateStatus']);
});

Route::prefix('v1/customer/returns')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [CustomerReturnController::class, 'index']);
    Route::post('/', [CustomerReturnController::class, 'store']);
    Route::post('{return}/cancel', [CustomerReturnController::class, 'cancel']);
});
