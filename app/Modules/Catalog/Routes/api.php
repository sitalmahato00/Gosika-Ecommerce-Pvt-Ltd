<?php

use App\Modules\Catalog\Presentation\Http\Controllers\AdminCatalogController;
use App\Modules\Catalog\Presentation\Http\Controllers\PublicCatalogController;
use App\Modules\Catalog\Presentation\Http\Controllers\VendorProductController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('categories', [PublicCatalogController::class, 'categories']);
    Route::get('brands', [PublicCatalogController::class, 'brands']);
    Route::get('products', [PublicCatalogController::class, 'products']);
    Route::get('products/{product}', [PublicCatalogController::class, 'show']);
});

Route::prefix('v1/vendor')->group(function () {
    Route::get('products', [VendorProductController::class, 'index']);
    Route::post('products', [VendorProductController::class, 'store']);
    Route::get('products/{product}', [VendorProductController::class, 'show']);
    Route::put('products/{product}', [VendorProductController::class, 'update']);
    Route::post('products/{product}/submit', [VendorProductController::class, 'submit']);
    Route::delete('products/{product}', [VendorProductController::class, 'destroy']);

    Route::get('brand-requests', [VendorProductController::class, 'myBrandRequests']);
    Route::post('brand-requests', [VendorProductController::class, 'requestBrand']);
});

Route::prefix('v1/admin')->group(function () {
    Route::get('products/pending', [AdminCatalogController::class, 'pendingProducts']);
    Route::post('products/{product}/approve', [AdminCatalogController::class, 'approveProduct']);
    Route::post('products/{product}/reject', [AdminCatalogController::class, 'rejectProduct']);

    Route::get('brand-requests', [AdminCatalogController::class, 'brandRequests']);
    Route::post('brand-requests/{brandRequest}/approve', [AdminCatalogController::class, 'approveBrandRequest']);
    Route::post('brand-requests/{brandRequest}/reject', [AdminCatalogController::class, 'rejectBrandRequest']);

    Route::get('categories', [AdminCatalogController::class, 'categories']);
    Route::post('categories', [AdminCatalogController::class, 'storeCategory']);
    Route::put('categories/{category}', [AdminCatalogController::class, 'updateCategory']);
    Route::delete('categories/{category}', [AdminCatalogController::class, 'deleteCategory']);

    Route::get('brands', [AdminCatalogController::class, 'brands']);
    Route::post('brands', [AdminCatalogController::class, 'storeBrand']);
    Route::put('brands/{brand}', [AdminCatalogController::class, 'updateBrand']);
    Route::delete('brands/{brand}', [AdminCatalogController::class, 'deleteBrand']);
});
