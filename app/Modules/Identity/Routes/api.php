<?php

use App\Modules\Identity\Presentation\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:auth');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password');
    Route::post('email/verify', [AuthController::class, 'verifyEmail'])->middleware('throttle:auth');
    Route::post('email/resend', [AuthController::class, 'resendEmailVerification'])->middleware('throttle:otp');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('logout-all', [AuthController::class, 'logoutAll']);
        Route::post('phone/otp', [AuthController::class, 'sendPhoneOtp'])->middleware('throttle:otp');
        Route::post('phone/verify', [AuthController::class, 'verifyPhone'])->middleware('throttle:otp');
    });
});
