<?php

use App\Modules\Support\Presentation\Http\Controllers\AdminSupportController;
use App\Modules\Support\Presentation\Http\Controllers\CustomerSupportController;
use App\Modules\Support\Presentation\Http\Controllers\VendorSupportController;
use App\Modules\Messaging\Presentation\Http\Controllers\ConversationController;
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

Route::prefix('v1/customer/conversations')->middleware(['auth:sanctum', 'ensure:customer'])->group(function () {
    Route::get('/', [ConversationController::class, 'customerIndex']);
    Route::post('/', [ConversationController::class, 'customerCreate']);
    Route::get('{conversation}', [ConversationController::class, 'customerShow']);
    Route::post('{conversation}/messages', [ConversationController::class, 'customerSend'])->middleware('throttle:30,1');
    Route::post('{conversation}/read', [ConversationController::class, 'customerRead']);
});

Route::prefix('v1/vendor/conversations')->middleware(['auth:sanctum', 'ensure:vendor'])->group(function () {
    Route::get('/', [ConversationController::class, 'vendorIndex']);
    Route::get('{conversation}', [ConversationController::class, 'vendorShow']);
    Route::post('{conversation}/messages', [ConversationController::class, 'vendorSend'])->middleware('throttle:30,1');
    Route::post('{conversation}/read', [ConversationController::class, 'vendorRead']);
});

Route::get('v1/conversations/{conversation}/messages/{message}/images/{index}', [ConversationController::class, 'image'])
    ->middleware('auth:sanctum')
    ->whereNumber('index');

Route::prefix('v1/admin/conversations')->middleware(['auth:sanctum', 'ensure:admin', 'permission:tickets.view'])->group(function () {
    Route::get('/', [ConversationController::class, 'adminIndex']);
    Route::get('{conversation}', [ConversationController::class, 'adminShow']);
    Route::post('{conversation}/messages', [ConversationController::class, 'adminSend'])->middleware('throttle:30,1');
    Route::post('{conversation}/read', [ConversationController::class, 'adminRead']);
});
