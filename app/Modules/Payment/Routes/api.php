<?php

use App\Modules\Payment\Presentation\Http\Controllers\AdminPaymentController;
use App\Modules\Payment\Presentation\Http\Controllers\AdminRefundController;
use App\Modules\Payment\Presentation\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/payments')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('initiate', [PaymentController::class, 'initiate'])->middleware('throttle:payment');
        Route::get('{payment}', [PaymentController::class, 'show']);
        Route::get('{payment}/status', [PaymentController::class, 'status']);
        Route::post('esewa/verify-by-order', [PaymentController::class, 'esewaVerifyByOrder'])->middleware('throttle:payment');
    });

    Route::post('khalti/callback', [PaymentController::class, 'callback'])->middleware('throttle:payment');
    Route::post('esewa/callback', [PaymentController::class, 'esewaCallback'])->middleware('throttle:payment');
});

Route::prefix('v1/admin')->group(function () {
    Route::get('payments', [AdminPaymentController::class, 'index']);
    Route::get('payments/{payment}', [AdminPaymentController::class, 'show']);
    Route::post('payments/{payment}/refund', [AdminPaymentController::class, 'refund']);

    Route::get('refunds', [AdminRefundController::class, 'index']);
    Route::get('refunds/{refund}', [AdminRefundController::class, 'show']);
    Route::post('refunds/{refund}/approve', [AdminRefundController::class, 'approve']);
    Route::post('refunds/{refund}/reject', [AdminRefundController::class, 'reject']);
});
