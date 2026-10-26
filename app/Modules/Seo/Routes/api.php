<?php

use App\Modules\Seo\Presentation\Http\Controllers\AdminSeoController;
use App\Modules\Seo\Presentation\Http\Controllers\PublicSeoController;
use Illuminate\Support\Facades\Route;

// Admin SEO routes (protected)
Route::prefix('v1/admin/seo')
    ->middleware(['auth:sanctum', 'role:' . \App\Modules\Identity\Domain\Roles::SUPER_ADMIN])
    ->group(function () {
        Route::get('dashboard', [AdminSeoController::class, 'dashboard']);

        Route::get('settings', [AdminSeoController::class, 'getGlobalSettings']);
        Route::put('settings', [AdminSeoController::class, 'updateGlobalSettings']);

        Route::get('meta', [AdminSeoController::class, 'getMeta']);
        Route::post('meta', [AdminSeoController::class, 'upsertMeta']);
        Route::delete('meta/{id}', [AdminSeoController::class, 'deleteMeta']);

        Route::get('templates', [AdminSeoController::class, 'getTemplates']);
        Route::post('templates', [AdminSeoController::class, 'upsertTemplate']);
        Route::delete('templates/{id}', [AdminSeoController::class, 'deleteTemplate']);

        Route::get('keywords', [AdminSeoController::class, 'getKeywords']);
        Route::post('keywords', [AdminSeoController::class, 'upsertKeyword']);
        Route::delete('keywords/{id}', [AdminSeoController::class, 'deleteKeyword']);

        Route::get('redirects', [AdminSeoController::class, 'getRedirects']);
        Route::post('redirects', [AdminSeoController::class, 'upsertRedirect']);
        Route::delete('redirects/{id}', [AdminSeoController::class, 'deleteRedirect']);

        Route::get('audit', [AdminSeoController::class, 'getAuditResults']);
        Route::post('audit/run', [AdminSeoController::class, 'runAudit']);
        Route::post('audit/{id}/resolve', [AdminSeoController::class, 'resolveAuditItem']);

        Route::get('sitemap', [AdminSeoController::class, 'getSitemapIndex']);
        Route::get('robots', [AdminSeoController::class, 'getRobotsTxt']);
        Route::put('robots', [AdminSeoController::class, 'updateRobotsTxt']);
    });

// Public SEO routes (no auth)
Route::prefix('v1/seo')->group(function () {
    Route::get('meta', [PublicSeoController::class, 'entityMeta'])->middleware('throttle:60,1');
    Route::get('sitemap.xml', [PublicSeoController::class, 'sitemapIndex']);
    Route::get('sitemap/{type}.xml', [PublicSeoController::class, 'sitemap']);
    Route::get('robots.txt', [PublicSeoController::class, 'robotsTxt']);
});
