<?php

use App\Modules\Vendor\Presentation\Http\Controllers\AdminSellerTierController;
use App\Modules\Vendor\Presentation\Http\Controllers\AdminVendorController;
use App\Modules\Vendor\Presentation\Http\Controllers\BankAccountController;
use App\Modules\Vendor\Presentation\Http\Controllers\StoreController;
use App\Modules\Vendor\Presentation\Http\Controllers\VendorController;
use App\Modules\Vendor\Presentation\Http\Controllers\VendorSecurityController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/vendor')->middleware(['auth:sanctum', 'ensure:vendor'])->group(function () {
    Route::post('apply', [VendorController::class, 'apply'])->withoutMiddleware(['ensure:vendor']);
    Route::get('me', [VendorController::class, 'myVendor']);
    Route::put('me', [VendorController::class, 'update']);
    Route::post('kyc', [VendorController::class, 'submitKyc']);
    Route::post('documents', [VendorController::class, 'uploadDocument']);

    Route::get('profile', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'show']);
    Route::put('profile', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'update']);
    Route::post('profile/avatar', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'uploadAvatar']);
    Route::put('profile/password', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'updatePassword']);
    Route::put('profile/notifications', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'updateNotifications']);
    Route::put('profile/preferences', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'updatePreferences']);

    Route::get('security', [VendorSecurityController::class, 'index']);
    Route::put('password', [VendorSecurityController::class, 'changePassword']);
    Route::delete('sessions/{token}', [VendorSecurityController::class, 'revokeSession']);
    Route::delete('sessions', [VendorSecurityController::class, 'revokeAllSessions']);
    Route::put('2fa', [VendorSecurityController::class, 'updateTwoFactor']);
    Route::get('notification-settings', [VendorSecurityController::class, 'notificationSettings']);
    Route::put('notification-settings', [VendorSecurityController::class, 'updateNotificationSettings']);

    Route::get('stores', [StoreController::class, 'myStores']);
    Route::post('stores', [StoreController::class, 'create']);
    Route::put('stores/{store}', [StoreController::class, 'update']);
    Route::post('stores/{store}/submit', [StoreController::class, 'submit']);

    Route::get('bank-accounts', [BankAccountController::class, 'index']);
    Route::post('bank-accounts', [BankAccountController::class, 'store']);
    Route::delete('bank-accounts/{account}', [BankAccountController::class, 'destroy']);
});

Route::prefix('v1/admin/vendors')->middleware(['auth:sanctum', 'ensure:admin'])->group(function () {
    Route::get('/', [AdminVendorController::class, 'index']);
    Route::get('stores', [AdminVendorController::class, 'stores']);
    Route::get('kyc', [AdminVendorController::class, 'kycList']);
    Route::get('kyc/{kyc}', [AdminVendorController::class, 'kycShow']);
    Route::post('kyc/{kyc}/approve', [AdminVendorController::class, 'approveKyc']);
    Route::post('kyc/{kyc}/reject', [AdminVendorController::class, 'rejectKyc']);
    Route::post('kyc/{kyc}/request-changes', [AdminVendorController::class, 'requestChangesKyc']);

    Route::get('{vendor}', [AdminVendorController::class, 'show']);
    Route::post('{vendor}/approve', [AdminVendorController::class, 'approve']);
    Route::post('{vendor}/reject', [AdminVendorController::class, 'reject']);
    Route::post('{vendor}/suspend', [AdminVendorController::class, 'suspend']);
    Route::post('{vendor}/activate', [AdminVendorController::class, 'activate']);

    Route::post('stores/{store}/approve', [AdminVendorController::class, 'approveStore']);
    Route::post('stores/{store}/reject', [AdminVendorController::class, 'rejectStore']);
});

Route::prefix('v1/admin/marketplace/tiers')->middleware(['auth:sanctum', 'ensure:admin'])->group(function () {
    Route::get('assignments', [AdminSellerTierController::class, 'assignments']);
    Route::get('/', [AdminSellerTierController::class, 'index']);
    Route::post('/', [AdminSellerTierController::class, 'store']);
    Route::post('vendors/{vendor}/assign', [AdminSellerTierController::class, 'assign']);
    Route::put('{tier}', [AdminSellerTierController::class, 'update']);
    Route::delete('{tier}', [AdminSellerTierController::class, 'destroy']);
});
