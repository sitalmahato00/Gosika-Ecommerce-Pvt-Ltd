<?php

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

Route::prefix('v1/admin/settings')->group(function () {
    Route::get('/', [SettingsController::class, 'index'])->middleware('throttle:admin');
    Route::put('{key}', [SettingsController::class, 'update'])->middleware('throttle:admin');
    Route::delete('{key}', [SettingsController::class, 'destroy'])->middleware('throttle:admin');
});
