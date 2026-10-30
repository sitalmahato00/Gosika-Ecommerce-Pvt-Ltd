<?php

namespace App\Modules\Platform\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Platform\Application\Services\SettingsService;
use App\Modules\Platform\Presentation\Http\Requests\UpdateBrandingSettingsRequest;
use App\Modules\Platform\Presentation\Http\Requests\UpdateCommissionSettingsRequest;
use App\Modules\Platform\Presentation\Http\Requests\UpdateGeneralSettingsRequest;
use App\Modules\Platform\Presentation\Http\Requests\UpdateOrderSettingsRequest;
use App\Modules\Platform\Presentation\Http\Requests\UpdatePaymentSettingsRequest;
use App\Modules\Platform\Presentation\Http\Requests\UpdateShippingSettingsRequest;
use App\Modules\Platform\Presentation\Http\Requests\UpdateVendorSettingsRequest;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class AdminSettingsController extends Controller
{
    public function __construct(
        protected SettingsService $settingsService
    ) {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
    }

    public function getGeneral(): JsonResponse
    {
        $settings = $this->settingsService->getGroup('general', false);
        return Response::success($settings, 'General settings retrieved.');
    }

    public function updateGeneral(UpdateGeneralSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $updated = $this->settingsService->updateGroup('general', $validated, $request->user());
        return Response::success($updated, 'General settings updated successfully.');
    }

    public function getBranding(): JsonResponse
    {
        $settings = $this->settingsService->getGroup('branding', false);
        return Response::success($settings, 'Branding settings retrieved.');
    }

    public function updateBranding(UpdateBrandingSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $filesToProcess = [
            'logo_light_file' => 'logo_light',
            'logo_dark_file'  => 'logo_dark',
            'favicon_file'    => 'favicon_url',
            'login_bg_file'   => 'login_bg_url',
            'email_logo_file' => 'email_logo_url',
        ];

        foreach ($filesToProcess as $fileKey => $settingKey) {
            if ($request->hasFile($fileKey) && $request->file($fileKey)->isValid()) {
                $file = $request->file($fileKey);
                $path = $file->store('branding', 'public');
                $validated[$settingKey] = Storage::disk('public')->url($path);
                unset($validated[$fileKey]);
            }
        }

        $updated = $this->settingsService->updateGroup('branding', $validated, $request->user());
        Cache::forget('platform.public_config');
        Cache::forget('seo.spa_head_data');
        return Response::success($updated, 'Branding settings updated successfully.');
    }

    public function getCommissions(): JsonResponse
    {
        $settings = $this->settingsService->getGroup('commission', false);
        return Response::success($settings, 'Commission settings retrieved.');
    }

    public function updateCommissions(UpdateCommissionSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $updated = $this->settingsService->updateGroup('commission', $validated, $request->user());
        return Response::success($updated, 'Commission settings updated successfully.');
    }

    public function getShipping(): JsonResponse
    {
        $settings = $this->settingsService->getGroup('shipping', false);
        return Response::success($settings, 'Shipping & return settings retrieved.');
    }

    public function updateShipping(UpdateShippingSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $updated = $this->settingsService->updateGroup('shipping', $validated, $request->user());
        return Response::success($updated, 'Shipping & return settings updated successfully.');
    }

    public function getPayments(): JsonResponse
    {
        $settings = $this->settingsService->getGroup('payment', true);
        return Response::success($settings, 'Payment gateway settings retrieved.');
    }

    public function updatePayments(UpdatePaymentSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        // Ensure keys follow expected namespaces if needed
        $paymentData = [];
        foreach ($validated as $key => $val) {
            if (! str_starts_with($key, 'payment.') && ! str_starts_with($key, 'checkout.')) {
                if ($key === 'cod_enabled') {
                    $paymentData['checkout.cod_enabled'] = $val;
                    $paymentData['payment.cod_enabled'] = $val;
                } else {
                    $paymentData['payment.' . $key] = $val;
                }
            } else {
                $paymentData[$key] = $val;
            }
        }

        $updated = $this->settingsService->updateGroup('payment', $paymentData, $request->user());
        return Response::success($updated, 'Payment gateway settings updated successfully.');
    }

    public function getVendors(): JsonResponse
    {
        $settings = $this->settingsService->getGroup('store', false);
        return Response::success($settings, 'Store & vendor settings retrieved.');
    }

    public function updateVendors(UpdateVendorSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $updated = $this->settingsService->updateGroup('store', $validated, $request->user());
        return Response::success($updated, 'Store & vendor settings updated successfully.');
    }

    public function getOrders(): JsonResponse
    {
        $group = $this->settingsService->getGroup('orders', false);

        $data = [
            'cancellation_window_minutes' => (int) ($group['order.cancellation_window_minutes'] ?? $group['cancellation_window_minutes'] ?? 15),
            'vendor_confirmation_deadline_hours' => (int) ($group['order.vendor_confirmation_deadline_hours'] ?? $group['vendor_confirmation_deadline_hours'] ?? 24),
            'auto_confirmation_enabled' => (bool) ($group['order.auto_confirmation_enabled'] ?? $group['auto_confirmation_enabled'] ?? false),
            'auto_confirmation_minutes' => (int) ($group['order.auto_confirmation_minutes'] ?? $group['auto_confirmation_minutes'] ?? 30),
        ];

        return Response::success($data, 'Order confirmation and cancellation settings retrieved.');
    }

    public function updateOrders(UpdateOrderSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $saveData = [
            'order.cancellation_window_minutes' => (int) $validated['cancellation_window_minutes'],
            'order.vendor_confirmation_deadline_hours' => (int) $validated['vendor_confirmation_deadline_hours'],
            'order.auto_confirmation_enabled' => (bool) $validated['auto_confirmation_enabled'],
            'order.auto_confirmation_minutes' => (int) $validated['auto_confirmation_minutes'],
        ];

        $this->settingsService->updateGroup('orders', $saveData, $request->user());
        Cache::forget('platform.public_config');

        return Response::success($validated, 'Order confirmation and cancellation settings updated successfully.');
    }
}
