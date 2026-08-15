<?php

use App\Modules\Cart\Presentation\Http\Controllers\CartController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/cart')->middleware('throttle:auth')->group(function () {
    Route::get('/', [CartController::class, 'show']);
    Route::post('/items', [CartController::class, 'store']);
    Route::put('/items/{item}', [CartController::class, 'update']);
    Route::delete('/items/{item}', [CartController::class, 'destroy']);
    Route::delete('/', [CartController::class, 'clear']);
});
