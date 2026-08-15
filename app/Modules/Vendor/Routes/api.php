<?php

use App\Modules\Vendor\Presentation\Http\Controllers\AdminVendorController;
use App\Modules\Vendor\Presentation\Http\Controllers\BankAccountController;
use App\Modules\Vendor\Presentation\Http\Controllers\StoreController;
use App\Modules\Vendor\Presentation\Http\Controllers\VendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/vendor')->group(function () {
    Route::post('apply', [VendorController::class, 'apply']);
    Route::get('me', [VendorController::class, 'myVendor']);
    Route::post('kyc', [VendorController::class, 'submitKyc']);
    Route::post('documents', [VendorController::class, 'uploadDocument']);

    Route::get('stores', [StoreController::class, 'myStores']);
    Route::post('stores', [StoreController::class, 'create']);
    Route::put('stores/{store}', [StoreController::class, 'update']);
    Route::post('stores/{store}/submit', [StoreController::class, 'submit']);

    Route::get('bank-accounts', [BankAccountController::class, 'index']);
    Route::post('bank-accounts', [BankAccountController::class, 'store']);
    Route::delete('bank-accounts/{account}', [BankAccountController::class, 'destroy']);
});

Route::prefix('v1/admin/vendors')->group(function () {
    Route::get('/', [AdminVendorController::class, 'index']);
    Route::get('{vendor}', [AdminVendorController::class, 'show']);
    Route::post('{vendor}/approve', [AdminVendorController::class, 'approve']);
    Route::post('{vendor}/reject', [AdminVendorController::class, 'reject']);

    Route::post('stores/{store}/approve', [AdminVendorController::class, 'approveStore']);
    Route::post('stores/{store}/reject', [AdminVendorController::class, 'rejectStore']);
});
