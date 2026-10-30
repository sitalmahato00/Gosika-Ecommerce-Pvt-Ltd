<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketing\Infrastructure\Models\VendorPromotion;
use App\Modules\Marketing\Presentation\Resources\VendorPromotionResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminPromotionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
        $this->middleware('permission:'.Permissions::PROMOTIONS_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $promotions = VendorPromotion::query()
            ->with(['vendor:id,user_id,company_name,status'])
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('type') && $request->input('type') !== 'all', fn ($q, $type) => $q->where('type', $type))
            ->when($request->input('vendor_id'), fn ($q, $vendorId) => $q->where('vendor_id', $vendorId))
            ->when($request->input('search'), function ($q, $s) {
                $q->where(function ($inner) use ($s) {
                    $inner->where('name', 'like', "%{$s}%")
                        ->orWhereHas('vendor', fn ($v) => $v->where('company_name', 'like', "%{$s}%"));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorPromotionResource::collection($promotions),
            'Product promotions retrieved.',
            ['pagination' => [
                'total' => $promotions->total(),
                'per_page' => $promotions->perPage(),
                'current_page' => $promotions->currentPage(),
                'last_page' => $promotions->lastPage(),
            ]]
        );
    }

    public function stats(): JsonResponse
    {
        $counts = [
            'total' => VendorPromotion::count(),
            'active' => VendorPromotion::where('status', 'active')->count(),
            'scheduled' => VendorPromotion::where('status', 'scheduled')->count(),
            'draft' => VendorPromotion::where('status', 'draft')->count(),
            'paused' => VendorPromotion::where('status', 'paused')->count(),
            'ended' => VendorPromotion::where('status', 'ended')->count(),
        ];

        return Response::success($counts, 'Product promotion stats.');
    }

    public function updateStatus(Request $request, string $promotionId): JsonResponse
    {
        $promotion = VendorPromotion::where('uuid', $promotionId)->firstOrFail();
        $data = $request->validate(['status' => ['required', 'in:draft,scheduled,active,paused,ended']]);
        $promotion->update($data);

        app(AuditLogService::class)->record($request->user(), 'promotion.status', 'vendor_promotion', $promotion->uuid, null, ['status' => $data['status'], 'name' => $promotion->name]);

        return Response::success(new VendorPromotionResource($promotion->fresh(['vendor:id,user_id,company_name,status'])), 'Promotion status updated.');
    }

    public function destroy(Request $request, string $promotionId): JsonResponse
    {
        $promotion = VendorPromotion::where('uuid', $promotionId)->firstOrFail();
        app(AuditLogService::class)->record($request->user(), 'promotion.deleted', 'vendor_promotion', $promotion->uuid, null, ['name' => $promotion->name]);
        $promotion->delete();

        return Response::success(null, 'Promotion deleted.');
    }
}