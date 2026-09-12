<?php

namespace App\Modules\Checkout\Presentation\Http\Controllers;

use App\Modules\Checkout\Application\Services\CheckoutService;
use App\Modules\Checkout\Presentation\Http\Requests\CheckoutRequest;
use App\Modules\Checkout\Presentation\Resources\CheckoutSessionResource;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class CheckoutController extends Controller
{
    public function __construct(protected CheckoutService $checkoutService)
    {
    }

    public function summary(): JsonResponse
    {
        $rawItems = request()->query('items') ?? request()->query('selected_item_ids') ?? request()->input('item_ids');
        $selected = null;
        if (is_array($rawItems)) {
            $selected = array_values(array_filter($rawItems));
        } elseif (is_string($rawItems) && trim($rawItems) !== '') {
            $selected = array_values(array_filter(explode(',', $rawItems)));
        }

        $summary = $this->checkoutService->summary(request()->user(), $selected);

        return Response::success([
            'item_count' => $summary['item_count'],
            'subtotal' => number_format($summary['subtotal'], 2, '.', ''),
            'discount' => number_format($summary['discount'], 2, '.', ''),
            'delivery_charge' => number_format($summary['delivery_charge'], 2, '.', ''),
            'tax' => number_format($summary['tax'], 2, '.', ''),
            'total' => number_format($summary['total'], 2, '.', ''),
        ], 'Checkout summary.');
    }

    public function create(CheckoutRequest $request): JsonResponse
    {
        try {
            $session = $this->checkoutService->create(request()->user(), $request->validated());

            return Response::created(new CheckoutSessionResource($session), 'Checkout session created.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function show(string $session): JsonResponse
    {
        $session = $this->checkoutService->pendingFor(request()->user(), $session);

        if (! $session) {
            return Response::error('Checkout session not found.', [], 404);
        }

        return Response::success(new CheckoutSessionResource($session), 'Checkout session retrieved.');
    }
}
