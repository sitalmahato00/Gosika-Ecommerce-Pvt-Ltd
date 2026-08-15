<?php

use App\Modules\Wallet\Presentation\Http\Controllers\AdminCommissionController;
use App\Modules\Wallet\Presentation\Http\Controllers\AdminWalletController;
use App\Modules\Wallet\Presentation\Http\Controllers\VendorWalletController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin')->group(function () {
    Route::get('commissions', [AdminCommissionController::class, 'index']);
    Route::put('commissions/vendors/{vendor}', [AdminCommissionController::class, 'updateRate']);
});

Route::prefix('v1/vendor/wallet')->group(function () {
    Route::get('/', [VendorWalletController::class, 'summary']);
    Route::get('transactions', [VendorWalletController::class, 'transactions']);
    Route::get('payouts', [VendorWalletController::class, 'payouts']);
    Route::post('payouts', [VendorWalletController::class, 'requestPayout']);
});

Route::prefix('v1/admin/wallet')->group(function () {
    Route::get('wallets', [AdminWalletController::class, 'wallets']);
    Route::get('payouts', [AdminWalletController::class, 'allPayouts']);
    Route::get('settlements', [AdminWalletController::class, 'allSettlements']);

    Route::get('vendors/{vendor}/wallet', [AdminWalletController::class, 'wallet']);
    Route::get('vendors/{vendor}/transactions', [AdminWalletController::class, 'transactions']);
    Route::get('vendors/{vendor}/commissions', [AdminWalletController::class, 'commissions']);
    Route::get('vendors/{vendor}/settlements', [AdminWalletController::class, 'settlements']);
    Route::post('vendors/{vendor}/wallet/adjust', [AdminWalletController::class, 'adjustBalance']);
    Route::get('vendors/{vendor}/payouts', [AdminWalletController::class, 'payouts']);

    Route::post('settlements/generate', [AdminWalletController::class, 'generateSettlement']);

    Route::post('payouts/{payout}/approve', [AdminWalletController::class, 'approvePayout']);
    Route::post('payouts/{payout}/reject', [AdminWalletController::class, 'rejectPayout']);
    Route::post('payouts/{payout}/mark-paid', [AdminWalletController::class, 'markPayoutPaid']);
    Route::post('payouts/{payout}/cancel', [AdminWalletController::class, 'cancelPayout']);
});
