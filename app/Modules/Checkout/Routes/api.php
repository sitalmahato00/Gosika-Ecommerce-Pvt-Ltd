<?php

use App\Modules\Checkout\Presentation\Http\Controllers\CheckoutController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/checkout')->middleware(['auth:sanctum', 'throttle:auth'])->group(function () {
    Route::get('/summary', [CheckoutController::class, 'summary']);
    Route::get('/{session}', [CheckoutController::class, 'show']);
    Route::post('/', [CheckoutController::class, 'create']);
});
