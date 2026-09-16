<?php

use App\Modules\Administration\Presentation\Http\Controllers\AdminAuditLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin')->middleware(['auth:sanctum', 'ensure:admin'])->group(function () {
    Route::get('audit-logs', [AdminAuditLogController::class, 'index']);

    Route::get('profile', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'show']);
    Route::put('profile', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'update']);
    Route::post('profile/avatar', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'uploadAvatar']);
    Route::put('password', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'updatePassword']);
    Route::put('notifications/preferences', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'updateNotifications']);
    Route::put('preferences', [\App\Modules\Identity\Presentation\Http\Controllers\UserProfileController::class, 'updatePreferences']);
});
