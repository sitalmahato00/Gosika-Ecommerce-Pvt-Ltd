<?php

use App\Modules\Administration\Presentation\Http\Controllers\AdminAuditLogController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/admin')->group(function () {
    Route::get('audit-logs', [AdminAuditLogController::class, 'index']);
});
