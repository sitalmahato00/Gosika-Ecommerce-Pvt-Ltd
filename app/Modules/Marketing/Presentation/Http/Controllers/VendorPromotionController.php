<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketing\Infrastructure\Models\VendorPromotion;
use App\Modules\Marketing\Presentation\Resources\VendorPromotionResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class VendorPromotionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $promotions = VendorPromotion::query()
            ->where('vendor_id', $vendor->id)
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorPromotionResource::collection($promotions),
            'Promotions retrieved.',
            ['pagination' => [
                'total' => $promotions->total(),
                'per_page' => $promotions->perPage(),
                'current_page' => $promotions->currentPage(),
                'last_page' => $promotions->lastPage(),
            ]]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $data = $this->validate($request);

        $promotion = VendorPromotion::create([
            'vendor_id' => $vendor->id,
            'name' => $data['name'],
            'tagline' => $data['tagline'] ?? null,
            'type' => $data['type'],
            'discount_value' => $data['discount_value'],
            'category' => $data['category'] ?? null,
            'banner_image' => $data['banner_image'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'status' => $data['status'] ?? 'scheduled',
        ]);

        return Response::created(new VendorPromotionResource($promotion), 'Promotion created.');
    }

    public function update(Request $request, string $promotionId): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $promotion = VendorPromotion::where('uuid', $promotionId)->where('vendor_id', $vendor->id)->firstOrFail();
        $data = $this->validate($request);

        $promotion->update([
            'name' => $data['name'],
            'tagline' => $data['tagline'] ?? null,
            'type' => $data['type'],
            'discount_value' => $data['discount_value'],
            'category' => $data['category'] ?? null,
            'banner_image' => $data['banner_image'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'status' => $data['status'] ?? $promotion->status,
        ]);

        return Response::success(new VendorPromotionResource($promotion->fresh()), 'Promotion updated.');
    }

    public function destroy(Request $request, string $promotionId): JsonResponse
    {
        $vendor = $this->vendorFor($request);
        $promotion = VendorPromotion::where('uuid', $promotionId)->where('vendor_id', $vendor->id)->firstOrFail();
        $promotion->delete();

        return Response::success(null, 'Promotion deleted.');
    }

    protected function validate(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:250'],
            'tagline' => ['nullable', 'string'],
            'type' => ['required', 'in:percentage,fixed,free_shipping,buy_one_get_one'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'category' => ['nullable', 'string', 'max:120'],
            'banner_image' => ['nullable', 'string', 'max:600'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', 'in:draft,scheduled,active,ended'],
        ]);
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to manage promotions.', 403);
        }

        return $vendor;
    }
}
