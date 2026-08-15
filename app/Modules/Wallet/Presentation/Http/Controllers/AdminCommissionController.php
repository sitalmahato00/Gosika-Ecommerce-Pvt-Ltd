<?php

namespace App\Modules\Wallet\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use App\Modules\Wallet\Infrastructure\Models\Commission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminCommissionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::WALLETS_VIEW);
    }

    public function index(Request $request): JsonResponse
    {
        $vendors = Vendor::query()
            ->withCount(['orders as orders_count' => function ($q) {
                $q->where('status', '!=', 'cancelled');
            }])
            ->when($request->input('search'), fn ($q, $s) => $q->where('company_name', 'like', "%{$s}%"))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        $earnings = Commission::query()
            ->selectRaw('vendor_id, SUM(amount) as total')
            ->where('status', '!=', 'reversed')
            ->groupBy('vendor_id')
            ->pluck('total', 'vendor_id');

        $vendors->getCollection()->transform(function ($vendor) use ($earnings) {
            $vendor->setAttribute('earned_commission', number_format((float) ($earnings[$vendor->id] ?? 0), 2, '.', ''));

            return $vendor;
        });

        $defaults = [
            'product_rate' => Setting::get('commission.product_rate', null),
            'category_rate' => Setting::get('commission.category_rate', null),
            'default_rate' => Setting::get('commission.default_rate', 10),
        ];

        return Response::success(
            $vendors->through(fn ($vendor) => [
                'id' => $vendor->uuid,
                'company_name' => $vendor->company_name,
                'business_email' => $vendor->business_email,
                'commission_rate' => $vendor->commission_rate,
                'orders_count' => (int) $vendor->orders_count,
                'earned_commission' => $vendor->earned_commission,
                'status' => $vendor->status,
            ])->values(),
            'Commission rates retrieved.',
            [
                'defaults' => $defaults,
                'pagination' => [
                    'total' => $vendors->total(),
                    'per_page' => $vendors->perPage(),
                    'current_page' => $vendors->currentPage(),
                    'last_page' => $vendors->lastPage(),
                ],
            ]
        );
    }

    public function updateRate(Request $request, string $vendorId): JsonResponse
    {
        $data = $request->validate([
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $vendor = Vendor::where('uuid', $vendorId)->firstOrFail();
        $oldRate = $vendor->commission_rate;
        $vendor->commission_rate = (float) $data['commission_rate'];
        $vendor->save();

        app(AuditLogService::class)->record($request->user(), 'commission.rate_updated', 'vendor', $vendor->uuid, ['commission_rate' => $oldRate], ['commission_rate' => $vendor->commission_rate]);

        return Response::success([
            'id' => $vendor->uuid,
            'company_name' => $vendor->company_name,
            'commission_rate' => $vendor->commission_rate,
        ], 'Commission rate updated.');
    }
}
