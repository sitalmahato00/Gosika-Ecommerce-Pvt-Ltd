<?php

use App\Modules\Order\Presentation\Http\Controllers\AdminOrderController;
use App\Modules\Order\Presentation\Http\Controllers\OrderController;
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
