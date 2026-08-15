<?php

use App\Modules\Identity\Presentation\Http\Controllers\AdminRoleController;
use App\Modules\Identity\Presentation\Http\Controllers\AdminUserController;
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

Route::prefix('v1/admin')->group(function () {
    Route::get('users', [AdminUserController::class, 'index']);
    Route::get('users/{user}', [AdminUserController::class, 'show']);
    Route::post('users/{user}/suspend', [AdminUserController::class, 'suspend']);
    Route::post('users/{user}/activate', [AdminUserController::class, 'activate']);
    Route::post('users/{user}/roles', [AdminUserController::class, 'assignRoles']);
    Route::delete('users/{user}', [AdminUserController::class, 'destroy']);

    Route::get('roles', [AdminRoleController::class, 'roles']);
    Route::get('permissions', [AdminRoleController::class, 'permissions']);
    Route::post('roles', [AdminRoleController::class, 'store']);
    Route::put('roles/{role}', [AdminRoleController::class, 'update']);
    Route::delete('roles/{role}', [AdminRoleController::class, 'destroy']);
});
