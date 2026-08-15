<?php

use App\Modules\Support\Presentation\Http\Controllers\AdminSupportController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin/support')->group(function () {
    Route::get('tickets', [AdminSupportController::class, 'index']);
    Route::get('tickets/{ticket}', [AdminSupportController::class, 'show']);
    Route::post('tickets/{ticket}/messages', [AdminSupportController::class, 'reply']);
    Route::post('tickets/{ticket}/close', [AdminSupportController::class, 'close']);
    Route::post('tickets/{ticket}/assign', [AdminSupportController::class, 'assign']);
});
