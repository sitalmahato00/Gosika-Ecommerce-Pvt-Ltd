<?php

namespace App\Modules\Order\Presentation\Http\Controllers;

use App\Modules\Order\Application\Services\ReturnService;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Presentation\Http\Requests\StoreReturnRequest;
use App\Modules\Order\Presentation\Resources\CustomerReturnResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CustomerReturnController extends Controller
{
    public function __construct(private readonly ReturnService $returnService)
    {
        $this->middleware('auth:sanctum');
    }

    // ─── List my returns ──────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $returns = ReturnRequest::query()
            ->with(['orderItem.product', 'order', 'media', 'statusHistory'])
            ->where('user_id', $request->user()->id)
            ->when($request->filled('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->filled('request_type'), fn ($q) => $q->where('request_type', $request->input('request_type')))
            ->when($request->filled('order_id'), fn ($q) => $q->whereHas(
                'order', fn ($q) => $q->where('uuid', $request->input('order_id'))
            ))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.$request->string('search')->trim().'%';
                $q->where(function ($inner) use ($term) {
                    $inner->where('return_number', 'like', $term)
                        ->orWhere('reason', 'like', $term)
                        ->orWhereHas('order', fn ($order) => $order->where('order_number', 'like', $term))
                        ->orWhereHas('orderItem', fn ($item) => $item->where('product_name', 'like', $term));
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            CustomerReturnResource::collection($returns),
            'Returns retrieved.',
            ['pagination' => [
                'total'        => $returns->total(),
                'per_page'     => $returns->perPage(),
                'current_page' => $returns->currentPage(),
                'last_page'    => $returns->lastPage(),
            ]]
        );
    }

    // ─── Show single return ───────────────────────────────────────────────

    public function show(Request $request, string $returnId): JsonResponse
    {
        $return = ReturnRequest::query()
            ->with(['orderItem.product', 'order', 'media', 'statusHistory.changedBy', 'refunds'])
            ->where('uuid', $returnId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $return) {
            return Response::error('Return not found.', [], 404);
        }

        return Response::success(new CustomerReturnResource($return), 'Return retrieved.');
    }

    // ─── STEP 1–3: Submit return request + upload media ───────────────────

    public function store(StoreReturnRequest $request): JsonResponse
    {
        try {
            $return = $this->returnService->createRequest(
                $request->user(),
                $request->validated(),
                $request->file('media', [])
            );

            return Response::created(
                new CustomerReturnResource($return),
                'Return request submitted successfully.'
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    // ─── Upload additional media to an existing request ───────────────────

    public function uploadMedia(Request $request, string $returnId): JsonResponse
    {
        $request->validate([
            'media'    => ['required', 'array', 'max:10'],
            'media.*'  => ['file', 'max:51200', 'mimes:jpg,jpeg,png,webp,gif,mp4,mov,avi'],
        ]);

        $return = ReturnRequest::query()
            ->where('uuid', $returnId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $return) {
            return Response::error('Return not found.', [], 404);
        }

        try {
            $this->returnService->uploadMedia($return, $request->file('media', []), $request->user());

            return Response::success(
                new CustomerReturnResource($return->load(['orderItem', 'order', 'media'])),
                'Media uploaded.'
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    // ─── Cancel ───────────────────────────────────────────────────────────

    public function cancel(Request $request, string $returnId): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $return = ReturnRequest::query()
            ->where('uuid', $returnId)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $return) {
            return Response::error('Return not found.', [], 404);
        }

        try {
            $return = $this->returnService->cancel($return, $request->user(), $request->input('reason', ''));

            return Response::success(
                new CustomerReturnResource($return->load(['orderItem', 'order', 'statusHistory'])),
                'Return cancelled.'
            );
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }
}
