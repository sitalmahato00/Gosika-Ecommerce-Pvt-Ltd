<?php

use App\Modules\Order\Presentation\Http\Controllers\AdminOrderController;
use App\Modules\Order\Presentation\Http\Controllers\CustomerReturnController;
use App\Modules\Order\Presentation\Http\Controllers\OrderController;
use App\Modules\Order\Presentation\Http\Controllers\VendorReturnController;
use Illuminate\Support\Facades\Route;

// ─── Customer Orders ──────────────────────────────────────────────────────────
Route::prefix('v1/orders')->middleware(['auth:sanctum', 'throttle:auth'])->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/{order}', [OrderController::class, 'show']);
    Route::post('/{order}/cancel', [OrderController::class, 'cancel']);
});

// ─── Admin Orders & Returns ───────────────────────────────────────────────────
Route::prefix('v1/admin/orders')->middleware(['auth:sanctum', 'ensure:admin'])->group(function () {
    // Orders
    Route::get('/', [AdminOrderController::class, 'index']);
    Route::get('/{order}', [AdminOrderController::class, 'show']);
    Route::post('/{order}/cancel', [AdminOrderController::class, 'cancel']);

    // Return management
    Route::get('/returns', [AdminOrderController::class, 'returns']);
    Route::post('/returns/{return}/approve', [AdminOrderController::class, 'approveReturn']);
    Route::post('/returns/{return}/reject', [AdminOrderController::class, 'rejectReturn']);
    Route::patch('/returns/{return}/status', [AdminOrderController::class, 'updateReturnStatus']);
    Route::post('/returns/{return}/refund', [AdminOrderController::class, 'processReturnRefund']);
    Route::post('/returns/{return}/exchange/dispatch', [AdminOrderController::class, 'dispatchExchange']);
    Route::post('/returns/{return}/close', [AdminOrderController::class, 'closeReturn']);
});

// ─── Vendor Returns ───────────────────────────────────────────────────────────
Route::prefix('v1/vendor/returns')->middleware(['auth:sanctum', 'ensure:vendor'])->group(function () {
    Route::get('/', [VendorReturnController::class, 'index']);
    Route::get('/{return}', [VendorReturnController::class, 'show']);

    // Step 5: Review
    Route::post('/{return}/approve', [VendorReturnController::class, 'approve']);
    Route::post('/{return}/reject', [VendorReturnController::class, 'reject']);

    // Step 6: Collected
    Route::post('/{return}/collect', [VendorReturnController::class, 'markCollected']);

    // Step 7: Inspect
    Route::post('/{return}/inspect', [VendorReturnController::class, 'inspect']);

    // Step 8: Replacement dispatch
    Route::post('/{return}/replacement/dispatch', [VendorReturnController::class, 'dispatchReplacement']);

    // Generic (kept for backwards compatibility)
    Route::post('/{return}/status', [VendorReturnController::class, 'updateStatus']);
});

// ─── Customer Returns ─────────────────────────────────────────────────────────
Route::prefix('v1/customer/returns')->middleware('auth:sanctum')->group(function () {
    // Step 1–3: List, view, submit
    Route::get('/', [CustomerReturnController::class, 'index']);
    Route::get('/{return}', [CustomerReturnController::class, 'show']);
    Route::post('/', [CustomerReturnController::class, 'store']);

    // Additional media upload
    Route::post('/{return}/media', [CustomerReturnController::class, 'uploadMedia']);

    // Cancel
    Route::post('/{return}/cancel', [CustomerReturnController::class, 'cancel']);
});
