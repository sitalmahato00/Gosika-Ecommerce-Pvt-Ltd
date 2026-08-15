<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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
