<?php

use App\Modules\Support\Presentation\Http\Controllers\AdminSupportController;
use App\Modules\Support\Presentation\Http\Controllers\CustomerSupportController;
use App\Modules\Support\Presentation\Http\Controllers\VendorSupportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/customer/support')->group(function () {
    Route::get('tickets', [CustomerSupportController::class, 'index']);
    Route::get('tickets/{ticket}', [CustomerSupportController::class, 'show']);
    Route::post('tickets', [CustomerSupportController::class, 'store']);
    Route::post('tickets/{ticket}/messages', [CustomerSupportController::class, 'message']);
    Route::post('tickets/{ticket}/close', [CustomerSupportController::class, 'close']);
});

Route::prefix('v1/admin/support')->group(function () {
    Route::get('tickets', [AdminSupportController::class, 'index']);
    Route::get('tickets/{ticket}', [AdminSupportController::class, 'show']);
    Route::post('tickets/{ticket}/messages', [AdminSupportController::class, 'reply']);
    Route::post('tickets/{ticket}/close', [AdminSupportController::class, 'close']);
    Route::post('tickets/{ticket}/assign', [AdminSupportController::class, 'assign']);
});

Route::prefix('v1/vendor/support')->group(function () {
    Route::get('tickets', [VendorSupportController::class, 'index']);
    Route::get('tickets/{ticket}', [VendorSupportController::class, 'show']);
    Route::post('tickets', [VendorSupportController::class, 'store']);
    Route::post('tickets/{ticket}/messages', [VendorSupportController::class, 'message']);
    Route::post('tickets/{ticket}/close', [VendorSupportController::class, 'close']);
    Route::post('tickets/{ticket}/reopen', [VendorSupportController::class, 'reopen']);
});
