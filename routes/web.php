<?php

use App\Http\Controllers\SpaController;
use App\Modules\Payment\Presentation\Http\Controllers\PaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| All public GET routes serve the React SPA through SpaController, which
| renders a Blade template with server-side SEO meta tags (including
| Google / Bing / Yandex verification tokens) injected into <head>.
| This ensures search-engine crawlers see the tags without executing JS.
|
*/

// ── Payment callbacks (handled server-side first, SPA fallback) ──────────

Route::get('/payments/esewa/callback', function (Request $request) {
    if ($request->has('data') && is_string($request->query('data'))) {
        return app(PaymentController::class)->esewaWebCallback($request);
    }

    return app(SpaController::class)();
});

Route::get('/payments/khalti/callback', function (Request $request) {
    if ($request->has('pidx') || $request->has('status')) {
        return app(PaymentController::class)->khaltiWebCallback($request);
    }

    return app(SpaController::class)();
});

// ── Homepage ─────────────────────────────────────────────────────────────
Route::get('/', SpaController::class);

// ── SPA fallback for all other public GET requests ───────────────────────
Route::fallback(function (Request $request) {
    if ($request->is('api/*') || $request->is('storage/*') || $request->is('up')) {
        return response()->json(['message' => 'Not Found.'], 404);
    }

    if ($request->isMethod('GET')) {
        return app(SpaController::class)();
    }

    return response()->json(['message' => 'Not Found.'], 404);
});
