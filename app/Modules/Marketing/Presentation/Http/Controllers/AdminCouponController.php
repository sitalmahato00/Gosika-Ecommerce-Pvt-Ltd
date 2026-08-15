<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketing\Infrastructure\Models\Coupon;
use App\Modules\Marketing\Presentation\Resources\CouponResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminCouponController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::COUPONS_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $coupons = Coupon::query()
            ->when($request->input('status'), function ($q, $status) {
                $q->where('is_active', $status === 'active');
            })
            ->when($request->input('search'), fn ($q, $s) => $q->where('code', 'like', "%{$s}%")->orWhere('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            CouponResource::collection($coupons),
            'Coupons retrieved.',
            ['pagination' => [
                'total' => $coupons->total(),
                'per_page' => $coupons->perPage(),
                'current_page' => $coupons->currentPage(),
                'last_page' => $coupons->lastPage(),
            ]]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validate($request);
        $coupon = Coupon::create($data);

        app(AuditLogService::class)->record($request->user(), 'coupon.created', 'coupon', $coupon->uuid, null, ['code' => $coupon->code]);

        return Response::created(new CouponResource($coupon), 'Coupon created.');
    }

    public function update(Request $request, string $couponId): JsonResponse
    {
        $coupon = Coupon::where('uuid', $couponId)->firstOrFail();
        $data = $this->validate($request, $coupon->id);
        $coupon->update($data);

        app(AuditLogService::class)->record($request->user(), 'coupon.updated', 'coupon', $coupon->uuid, null, ['code' => $coupon->code]);

        return Response::success(new CouponResource($coupon->fresh()), 'Coupon updated.');
    }

    public function destroy(Request $request, string $couponId): JsonResponse
    {
        $coupon = Coupon::where('uuid', $couponId)->firstOrFail();
        app(AuditLogService::class)->record($request->user(), 'coupon.deleted', 'coupon', $coupon->uuid, null, ['code' => $coupon->code]);
        $coupon->delete();

        return Response::success(null, 'Coupon deleted.');
    }

    protected function validate(Request $request, ?int $ignoreId = null): array
    {
        $unique = 'unique:coupons,code'.($ignoreId ? ",{$ignoreId}" : '');

        return $request->validate([
            'code' => ['required', 'string', 'max:60', $unique],
            'name' => ['nullable', 'string', 'max:180'],
            'description' => ['nullable', 'string', 'max:2000'],
            'discount_type' => ['required', 'in:fixed,percentage'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:0'],
            'per_user_limit' => ['nullable', 'integer', 'min:1'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date', 'after_or_equal:valid_from'],
            'is_active' => ['boolean'],
            'applies_to' => ['nullable', 'in:all,store,product'],
            'applies_to_ids' => ['array'],
            'is_first_order_only' => ['boolean'],
        ]);
    }
}
