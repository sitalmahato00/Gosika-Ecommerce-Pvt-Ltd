<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketing\Infrastructure\Models\Coupon;
use App\Modules\Marketing\Presentation\Resources\VendorCouponResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class VendorCouponController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $coupons = Coupon::query()
            ->where('vendor_id', $vendor->id)
            ->when($request->input('search'), fn ($q, $s) => $q->where('code', 'like', "%{$s}%")->orWhere('description', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorCouponResource::collection($coupons),
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
        $vendor = $this->vendorFor($request);
        $data = $this->validate($request);

        $coupon = Coupon::create([
            'vendor_id' => $vendor->id,
            'code' => $data['code'],
            'description' => $data['description'] ?? null,
            'discount_type' => $data['discount_type'],
            'discount_value' => $data['discount_value'],
            'min_order_amount' => $data['min_order_amount'] ?? null,
            'max_discount' => $data['max_discount'] ?? null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'per_user_limit' => $data['per_user_limit'] ?? null,
            'valid_from' => $data['start_date'] ?? null,
            'valid_until' => $data['end_date'] ?? null,
            'is_active' => ($data['status'] ?? null) !== 'expired',
        ]);

        return Response::created(new VendorCouponResource($coupon), 'Coupon created.');
    }

    public function update(Request $request, string $couponId): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $coupon = Coupon::where('uuid', $couponId)->where('vendor_id', $vendor->id)->firstOrFail();
        $data = $this->validate($request, $coupon->id);

        $coupon->update([
            'code' => $data['code'],
            'description' => $data['description'] ?? null,
            'discount_type' => $data['discount_type'],
            'discount_value' => $data['discount_value'],
            'min_order_amount' => $data['min_order_amount'] ?? null,
            'max_discount' => $data['max_discount'] ?? null,
            'usage_limit' => $data['usage_limit'] ?? null,
            'per_user_limit' => $data['per_user_limit'] ?? null,
            'valid_from' => $data['start_date'] ?? null,
            'valid_until' => $data['end_date'] ?? null,
            'is_active' => ($data['status'] ?? null) !== 'expired',
        ]);

        return Response::success(new VendorCouponResource($coupon->fresh()), 'Coupon updated.');
    }

    public function destroy(Request $request, string $couponId): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $coupon = Coupon::where('uuid', $couponId)->where('vendor_id', $vendor->id)->firstOrFail();
        $coupon->delete();

        return Response::success(null, 'Coupon deleted.');
    }

    protected function validate(Request $request, ?int $ignoreId = null): array
    {
        $unique = 'unique:coupons,code'.($ignoreId ? ",{$ignoreId}" : '');

        return $request->validate([
            'code' => ['required', 'string', 'max:60', $unique],
            'description' => ['nullable', 'string', 'max:2000'],
            'discount_type' => ['required', 'in:fixed,percentage,free_shipping'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount' => ['nullable', 'numeric', 'min:0'],
            'usage_limit' => ['nullable', 'integer', 'min:0'],
            'per_user_limit' => ['nullable', 'integer', 'min:1'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:active,scheduled,expired'],
        ]);
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to manage coupons.', 403);
        }

        return $vendor;
    }
}
