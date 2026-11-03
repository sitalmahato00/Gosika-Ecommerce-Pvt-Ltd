<?php

namespace App\Modules\Shipping\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Shared\Domain\Enums\DeliveryStatus;
use App\Modules\Shared\Domain\Enums\PaymentMethod;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Shipping\Infrastructure\Models\DeliveryAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class AdminCodReconciliationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:admin');
        $this->middleware('permission:'.Permissions::PAYMENTS_VIEW.'|'.Permissions::RECONCILIATION_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $baseQuery = DeliveryAssignment::query()
            ->where('status', DeliveryStatus::DELIVERED)
            ->where('cod_amount', '>', 0)
            ->whereHas('vendorOrder.order', fn ($query) => $query->where('payment_method', PaymentMethod::COD->value));

        $summary = [
            'pending_amount' => round((float) (clone $baseQuery)->whereNull('cod_reconciled_at')->sum('cod_amount'), 2),
            'pending_count' => (clone $baseQuery)->whereNull('cod_reconciled_at')->count(),
            'collected_amount' => round((float) (clone $baseQuery)->whereNotNull('cod_reconciled_at')->sum('cod_amount'), 2),
            'collected_count' => (clone $baseQuery)->whereNotNull('cod_reconciled_at')->count(),
        ];

        $query = (clone $baseQuery)->with(['deliveryPartner', 'vendorOrder.order.user', 'codReconciledBy']);
        $status = (string) $request->input('status', 'pending');
        if ($status === 'pending') {
            $query->whereNull('cod_reconciled_at');
        } elseif ($status === 'collected') {
            $query->whereNotNull('cod_reconciled_at');
        } elseif ($status !== 'all') {
            throw new DomainException('Choose pending, collected, or all COD records.', 422);
        }

        $search = trim((string) $request->input('search', ''));
        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->whereHas('deliveryPartner', fn ($partnerQuery) => $partnerQuery
                    ->where('name', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%'))
                    ->orWhereHas('vendorOrder.order', fn ($orderQuery) => $orderQuery
                        ->where('order_number', 'like', '%'.$search.'%'))
                    ->orWhereHas('vendorOrder', fn ($vendorOrderQuery) => $vendorOrderQuery
                        ->where('vendor_order_number', 'like', '%'.$search.'%'));
            });
        }

        $assignments = $query
            ->orderByDesc('delivered_at')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100));

        $rows = $assignments->getCollection()->map(fn (DeliveryAssignment $assignment) => $this->row($assignment));

        return Response::success($rows, 'COD reconciliation records retrieved.', [
            'summary' => $summary,
            'pagination' => [
                'current_page' => $assignments->currentPage(),
                'per_page' => $assignments->perPage(),
                'total' => $assignments->total(),
                'last_page' => $assignments->lastPage(),
            ],
        ]);
    }

    public function collect(Request $request, DeliveryAssignment $assignment): JsonResponse
    {
        $assignment = DB::transaction(function () use ($request, $assignment): DeliveryAssignment {
            $locked = DeliveryAssignment::query()->whereKey($assignment->getKey())->lockForUpdate()->firstOrFail();
            $locked->load('vendorOrder.order');

            if ($locked->status !== DeliveryStatus::DELIVERED
                || (float) $locked->cod_amount <= 0
                || $locked->vendorOrder?->order?->payment_method !== PaymentMethod::COD->value) {
                throw new DomainException('Only successfully delivered COD orders can be reconciled.', 422);
            }

            if ($locked->cod_reconciled_at) {
                throw new DomainException('This COD amount has already been recorded as received.', 422);
            }

            $locked->update([
                'cod_reconciled_at' => now(),
                'cod_reconciled_by' => $request->user()->id,
            ]);

            return $locked->fresh(['deliveryPartner', 'vendorOrder.order.user', 'codReconciledBy']);
        });

        return Response::success($this->row($assignment), 'COD cash receipt recorded.');
    }

    protected function row(DeliveryAssignment $assignment): array
    {
        $order = $assignment->vendorOrder?->order;

        return [
            'id' => $assignment->uuid,
            'order_number' => $order?->order_number,
            'vendor_order_number' => $assignment->vendorOrder?->vendor_order_number,
            'customer_name' => $order?->user?->full_name ?? $order?->user?->name,
            'delivery_partner_name' => $assignment->deliveryPartner?->name,
            'delivery_partner_phone' => $assignment->deliveryPartner?->phone,
            'cod_amount' => (float) $assignment->cod_amount,
            'delivered_at' => $assignment->delivered_at?->toISOString(),
            'cod_reconciled_at' => $assignment->cod_reconciled_at?->toISOString(),
            'cod_reconciled_by' => $assignment->codReconciledBy?->full_name ?? $assignment->codReconciledBy?->name,
            'status' => $assignment->cod_reconciled_at ? 'collected' : 'pending',
        ];
    }
}
