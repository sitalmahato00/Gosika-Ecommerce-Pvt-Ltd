<?php

use App\Modules\Payment\Presentation\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/payments')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('initiate', [PaymentController::class, 'initiate'])->middleware('throttle:payment');
        Route::get('{payment}', [PaymentController::class, 'show']);
        Route::get('{payment}/status', [PaymentController::class, 'status']);
    });

    Route::post('khalti/callback', [PaymentController::class, 'callback'])->middleware('throttle:payment');
});
