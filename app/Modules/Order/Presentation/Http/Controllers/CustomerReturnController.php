<?php

namespace App\Modules\Order\Presentation\Http\Controllers;

use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Order\Presentation\Resources\CustomerReturnResource;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class CustomerReturnController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $returns = ReturnRequest::query()
            ->with(['orderItem.product', 'order'])
            ->where('user_id', $request->user()->id)
            ->when($request->filled('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->filled('order_id'), fn ($query) => $query->whereHas('order', fn ($query) => $query->where('uuid', $request->input('order_id'))))
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            CustomerReturnResource::collection($returns),
            'Returns retrieved.',
            ['pagination' => [
                'total' => $returns->total(),
                'per_page' => $returns->perPage(),
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
            ]]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'order_id' => ['required', 'uuid', 'exists:orders,uuid'],
            'order_item_id' => ['required', 'uuid', 'exists:order_items,uuid'],
            'reason_type' => ['required', 'in:damaged,wrong_item,not_as_described,quality_issue,other'],
            'reason' => ['required', 'string', 'max:1000'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $order = Order::query()
            ->where('uuid', $data['order_id'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $order) {
            return Response::error('Order not found.', [], 404);
        }

        $orderItem = OrderItem::query()
            ->where('uuid', $data['order_item_id'])
            ->where('order_id', $order->id)
            ->first();

        if (! $orderItem) {
            return Response::error('Order item not found for this order.', [], 404);
        }

        if ($data['quantity'] > $orderItem->quantity) {
            return Response::error('Quantity exceeds purchased quantity.', [], 422);
        }

        $openReturnExists = ReturnRequest::query()
            ->where('order_item_id', $orderItem->id)
            ->whereNotIn('status', [
                ReturnStatus::CANCELLED,
                ReturnStatus::REJECTED,
                ReturnStatus::REFUNDED,
                ReturnStatus::COMPLETED,
            ])
            ->exists();

        if ($openReturnExists) {
            return Response::error('A return request already exists for this item.', [], 422);
        }

        $vendorOrder = $orderItem->vendor_order_id ? VendorOrder::find($orderItem->vendor_order_id) : null;

        $return = ReturnRequest::create([
            'return_number' => 'RTN-'.strtoupper(Str::random(8)),
            'user_id' => $request->user()->id,
            'order_id' => $order->id,
            'order_item_id' => $orderItem->id,
            'vendor_order_id' => $orderItem->vendor_order_id,
            'store_id' => $vendorOrder?->store_id,
            'vendor_id' => $orderItem->vendor_id,
            'reason_type' => $data['reason_type'],
            'reason' => $data['reason'],
            'quantity' => $data['quantity'],
            'status' => ReturnStatus::REQUESTED,
            'window_expires_at' => now()->addDays(7),
        ]);

        return Response::created(
            new CustomerReturnResource($return->load('orderItem.product', 'order')),
            'Return request submitted.'
        );
    }

    public function cancel(Request $request, string $returnId): JsonResponse
    {
        $return = ReturnRequest::query()
            ->where('uuid', $returnId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $return) {
            return Response::error('Return not found.', [], 404);
        }

        if (! in_array($return->status, [ReturnStatus::REQUESTED, ReturnStatus::UNDER_REVIEW], true)) {
            return Response::error('This return cannot be cancelled anymore.', [], 422);
        }

        $return->status = ReturnStatus::CANCELLED;
        $return->save();

        return Response::success(
            new CustomerReturnResource($return->load('orderItem.product', 'order')),
            'Return cancelled.'
        );
    }
}
