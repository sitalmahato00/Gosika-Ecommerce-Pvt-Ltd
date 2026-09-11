<?php

use App\Modules\Platform\Presentation\Http\Controllers\AdminLogsController;
use App\Modules\Platform\Presentation\Http\Controllers\AdminSettingsController;
use App\Modules\Platform\Presentation\Http\Controllers\GeoController;
use App\Modules\Platform\Presentation\Http\Controllers\PlatformConfigController;
use App\Modules\Platform\Presentation\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/platform')->group(function () {
    Route::get('config', [PlatformConfigController::class, 'publicConfig'])->middleware('throttle:public');
    Route::get('social-providers', [PlatformConfigController::class, 'socialProviders'])->middleware('throttle:public');
    Route::get('countries', [GeoController::class, 'countries'])->middleware('throttle:public');
    Route::get('provinces', [GeoController::class, 'provinces'])->middleware('throttle:public');
    Route::get('districts', [GeoController::class, 'districts'])->middleware('throttle:public');
    Route::get('municipalities', [GeoController::class, 'municipalities'])->middleware('throttle:public');
    Route::get('reverse-geocode', [GeoController::class, 'reverseGeocode'])->middleware('throttle:public');
});

Route::prefix('v1/admin/settings')->middleware(['auth:sanctum', 'ensure:admin', 'throttle:admin'])->group(function () {
    // Modular Domain Endpoints
    Route::get('general', [AdminSettingsController::class, 'getGeneral']);
    Route::put('general', [AdminSettingsController::class, 'updateGeneral']);

    Route::get('branding', [AdminSettingsController::class, 'getBranding']);
    Route::post('branding', [AdminSettingsController::class, 'updateBranding']);
    Route::put('branding', [AdminSettingsController::class, 'updateBranding']);

    Route::get('commissions', [AdminSettingsController::class, 'getCommissions']);
    Route::put('commissions', [AdminSettingsController::class, 'updateCommissions']);

    Route::get('shipping', [AdminSettingsController::class, 'getShipping']);
    Route::put('shipping', [AdminSettingsController::class, 'updateShipping']);

    Route::get('payments', [AdminSettingsController::class, 'getPayments']);
    Route::put('payments', [AdminSettingsController::class, 'updatePayments']);

    Route::get('vendors', [AdminSettingsController::class, 'getVendors']);
    Route::put('vendors', [AdminSettingsController::class, 'updateVendors']);

    // Legacy Fallback Endpoints (Fully Preserved)
    Route::get('/', [SettingsController::class, 'index']);
    Route::put('/', [SettingsController::class, 'batchUpdate']);
    Route::put('{key}', [SettingsController::class, 'update']);
    Route::delete('{key}', [SettingsController::class, 'destroy']);
});

Route::prefix('v1/admin')->middleware(['auth:sanctum', 'ensure:admin', 'throttle:admin'])->group(function () {
    Route::get('logs', [AdminLogsController::class, 'index']);
    Route::get('logs/view', [AdminLogsController::class, 'show']);
});
