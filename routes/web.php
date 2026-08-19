<?php

use App\Modules\Payment\Presentation\Http\Controllers\PaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/password/reset/{token}', function (\Illuminate\Http\Request $request, string $token) {
    $email = $request->query('email', '');
    $frontendUrl = rtrim(config('app.frontend_url'), '/');

    return redirect()->away(
        $frontendUrl . '/reset-password?' . http_build_query(['token' => $token, 'email' => $email])
    );
})->name('password.reset');

Route::get('/payments/esewa/callback', function (Request $request) {
    if ($request->has('data') && is_string($request->query('data'))) {
        return app(\App\Modules\Payment\Presentation\Http\Controllers\PaymentController::class)
            ->esewaWebCallback($request);
    }

    return response()->file(public_path('index.html'));
});

Route::get('/payments/khalti/callback', function (Request $request) {
    if ($request->has('pidx') || $request->has('status')) {
        return app(\App\Modules\Payment\Presentation\Http\Controllers\PaymentController::class)
            ->khaltiWebCallback($request);
    }

    return response()->file(public_path('index.html'));
});

Route::get('/', function () {
    return response()->file(public_path('index.html'));
});

Route::fallback(function (Request $request) {
    if ($request->is('api/*') || $request->is('storage/*') || $request->is('up')) {
        return response()->json(['message' => 'Not Found.'], 404);
    }

    if ($request->isMethod('GET')) {
        return response()->file(public_path('index.html'));
    }

    return response()->json(['message' => 'Not Found.'], 404);
});
