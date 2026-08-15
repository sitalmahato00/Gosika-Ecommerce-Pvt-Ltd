<?php

namespace App\Modules\Order\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Presentation\Resources\VendorReturnResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Validator;

class VendorReturnController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $returns = ReturnRequest::query()
            ->with(['user', 'orderItem', 'order.user'])
            ->where('vendor_id', $vendor->id)
            ->when($request->input('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->input('search'), fn ($query, $search) => $query
                ->where(fn ($query) => $query
                    ->where('return_number', 'like', "%{$search}%")
                    ->orWhereHas('orderItem', fn ($query) => $query->where('product_name', 'like', "%{$search}%")))
            )
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorReturnResource::collection($returns),
            'Returns retrieved.',
            ['pagination' => [
                'total' => $returns->total(),
                'per_page' => $returns->perPage(),
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
            ]]
        );
    }

    public function updateStatus(Request $request, string $returnId): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $return = ReturnRequest::query()
            ->where('uuid', $returnId)
            ->where('vendor_id', $vendor->id)
            ->firstOrFail();

        Validator::make($request->all(), [
            'status' => ['required', 'in:under_review,approved,rejected,collected,inspected,refund_pending,refunded,completed'],
            'response' => ['nullable', 'string', 'max:1000'],
        ])->validate();

        $return->status = $request->input('status');
        $return->review_notes = $request->input('response');
        $return->reviewed_by = $request->user()->id;
        $return->reviewed_at = now();
        $return->save();

        return Response::success(
            new VendorReturnResource($return->load('user', 'orderItem', 'order.user')),
            'Return status updated.'
        );
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access returns.', 403);
        }

        return $vendor;
    }
}
