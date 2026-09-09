<?php

use App\Modules\Customer\Presentation\Http\Controllers\AdminCustomerController;
use App\Modules\Customer\Presentation\Http\Controllers\CustomerAddressController;
use App\Modules\Customer\Presentation\Http\Controllers\CustomerProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin/customers')->group(function () {
    Route::get('/', [AdminCustomerController::class, 'index']);
    Route::get('/stats', [AdminCustomerController::class, 'stats']);
    Route::get('/segments', [AdminCustomerController::class, 'segments']);
    Route::get('/segments/{segment}', [AdminCustomerController::class, 'segmentMembers']);
    Route::get('/wallets', [AdminCustomerController::class, 'wallets']);
    Route::get('/wallets/{user}', [AdminCustomerController::class, 'walletDetail']);
    Route::get('/wallets/{user}/transactions', [AdminCustomerController::class, 'walletTransactions']);
});

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
