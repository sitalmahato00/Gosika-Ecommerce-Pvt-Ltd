<?php

namespace App\Modules\Vendor\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Application\Services\SellerTierService;
use App\Modules\Vendor\Infrastructure\Models\SellerTier;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Vendor\Presentation\Resources\SellerTierResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminSellerTierController extends Controller
{
    public function __construct(protected SellerTierService $service)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::VENDORS_APPROVE.'|'.Permissions::VENDORS_VIEW);
    }

    public function index(Request $request): JsonResponse
    {
        $tiers = SellerTier::query()
            ->withCount('vendors')
            ->when($request->filled('status'), fn ($q) => $q->where('is_active', $request->boolean('status')))
            ->orderBy('badge_level')
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 20));

        return Response::success(
            SellerTierResource::collection($tiers),
            'Seller tiers retrieved.',
            [
                'total' => $tiers->total(),
                'per_page' => $tiers->perPage(),
                'current_page' => $tiers->currentPage(),
                'last_page' => $tiers->lastPage(),
            ]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);

        $tier = SellerTier::create([
            ...$data,
            'slug' => $data['slug'] ?? Str::slug($data['name']),
        ]);

        app(AuditLogService::class)->record($request->user(), 'seller_tier.created', 'seller_tier', $tier->uuid, null, ['name' => $tier->name]);

        return Response::created(new SellerTierResource($tier), 'Seller tier created.');
    }

    public function update(Request $request, string $tierId): JsonResponse
    {
        $tier = SellerTier::where('uuid', $tierId)
            ->when(ctype_digit($tierId), fn ($q) => $q->orWhere('id', (int) $tierId))
            ->firstOrFail();
        $data = $this->validated($request);
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $tier->update($data);

        app(AuditLogService::class)->record($request->user(), 'seller_tier.updated', 'seller_tier', $tier->uuid, null, ['name' => $tier->name]);

        return Response::success(new SellerTierResource($tier->refresh()), 'Seller tier updated.');
    }

    public function destroy(Request $request, string $tierId): JsonResponse
    {
        $tier = SellerTier::where('uuid', $tierId)
            ->when(ctype_digit($tierId), fn ($q) => $q->orWhere('id', (int) $tierId))
            ->firstOrFail();

        if ($tier->vendors()->exists()) {
            throw new DomainException('This tier is assigned to vendors. Unassign vendors first before deleting.', 409);
        }

        $tier->delete();

        app(AuditLogService::class)->record($request->user(), 'seller_tier.deleted', 'seller_tier', null, null, ['name' => $tier->name]);

        return Response::success(null, 'Seller tier deleted.');
    }

    public function assignments(Request $request): JsonResponse
    {
        $tiers = collect($this->service->activeTiers());
        $vendors = $this->service->assignments();

        $items = $vendors->getCollection()->map(function (Vendor $vendor) use ($tiers) {
            $orderCount = (int) $vendor->order_count;
            $gmv = (float) $vendor->gmv;
            $computed = $tiers->first(fn ($t) => $orderCount >= (int) $t->min_orders && $gmv >= (float) $t->min_gmv);

            return [
                'id' => $vendor->uuid,
                'company_name' => $vendor->company_name,
                'business_email' => $vendor->business_email,
                'order_count' => $orderCount,
                'gmv' => $gmv,
                'created_at' => $vendor->created_at?->toISOString(),
                'seller_tier' => $vendor->sellerTier ? [
                    'id' => $vendor->sellerTier->uuid,
                    'name' => $vendor->sellerTier->name,
                    'slug' => $vendor->sellerTier->slug,
                    'badge_level' => $vendor->sellerTier->badge_level,
                    'badge_color' => $vendor->sellerTier->badge_color,
                    'badge_icon' => $vendor->sellerTier->badge_icon,
                ] : null,
                'computed_tier' => $computed ? [
                    'id' => $computed->uuid,
                    'name' => $computed->name,
                    'slug' => $computed->slug,
                    'badge_level' => $computed->badge_level,
                ] : null,
            ];
        });

        return Response::success($items->values(), 'Seller tier assignments retrieved.', [
            'total' => $vendors->total(),
            'per_page' => $vendors->perPage(),
            'current_page' => $vendors->currentPage(),
            'last_page' => $vendors->lastPage(),
        ]);
    }

    public function assign(Request $request, string $vendorId): JsonResponse
    {
        $request->validate([
            'tier_id' => ['nullable', 'uuid', 'exists:seller_tiers,uuid'],
        ]);

        $vendor = Vendor::where('uuid', $vendorId)
            ->when(ctype_digit($vendorId), fn ($q) => $q->orWhere('id', (int) $vendorId))
            ->firstOrFail();
        $tier = $request->input('tier_id') ? SellerTier::where('uuid', $request->input('tier_id'))->firstOrFail() : null;

        $vendor->update(['seller_tier_id' => $tier?->id]);

        app(AuditLogService::class)->record($request->user(), 'seller_tier.assigned', 'seller_tier', $tier?->uuid, null, [
            'vendor' => $vendor->company_name,
            'tier' => $tier?->name ?? 'none',
        ]);

        return Response::success([
            'id' => $vendor->uuid,
            'seller_tier' => $tier ? [
                'id' => $tier->uuid,
                'name' => $tier->name,
                'slug' => $tier->slug,
            ] : null,
        ], 'Seller tier assigned.');
    }

    protected function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120', \Illuminate\Validation\Rule::unique('seller_tiers', 'slug')->ignore($request->route('tier'))],
            'badge_level' => ['nullable', 'integer', 'min:0', 'max:20'],
            'min_orders' => ['nullable', 'integer', 'min:0'],
            'min_gmv' => ['nullable', 'numeric', 'min:0'],
            'commission_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'badge_color' => ['nullable', 'string', 'max:40'],
            'badge_icon' => ['nullable', 'string', 'max:40'],
            'description' => ['nullable', 'string', 'max:500'],
            'benefits' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}