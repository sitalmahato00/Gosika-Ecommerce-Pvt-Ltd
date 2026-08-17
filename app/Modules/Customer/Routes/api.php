<?php

use App\Modules\Customer\Presentation\Http\Controllers\CustomerAddressController;
use App\Modules\Customer\Presentation\Http\Controllers\CustomerProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/customer')->middleware('auth:sanctum')->group(function () {
    Route::get('profile', [CustomerProfileController::class, 'show']);
    Route::put('profile', [CustomerProfileController::class, 'update']);
    Route::put('profile/password', [CustomerProfileController::class, 'updatePassword']);
    Route::post('profile/avatar', [CustomerProfileController::class, 'uploadAvatar']);

    Route::get('addresses', [CustomerAddressController::class, 'index']);
    Route::post('addresses', [CustomerAddressController::class, 'store']);
    Route::get('addresses/{address}', [CustomerAddressController::class, 'show']);
    Route::put('addresses/{address}', [CustomerAddressController::class, 'update']);
    Route::delete('addresses/{address}', [CustomerAddressController::class, 'destroy']);
    Route::put('addresses/{address}/default', [CustomerAddressController::class, 'setDefault']);
});
