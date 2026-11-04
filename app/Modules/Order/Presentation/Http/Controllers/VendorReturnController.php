<?php

namespace App\Modules\Order\Presentation\Http\Controllers;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Order\Application\Services\ReturnService;
use App\Modules\Order\Infrastructure\Models\ReturnRequest;
use App\Modules\Order\Presentation\Resources\VendorReturnResource;
use App\Modules\Shared\Domain\Enums\ReturnStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class VendorReturnController extends Controller
{
    public function __construct(private readonly ReturnService $returnService)
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::VENDOR_ADMIN);
    }

    // ─── List vendor's returns ────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendorFor($request);

        $returns = ReturnRequest::query()
            ->with($this->returnRelations(['user', 'orderItem', 'order.user']))
            ->where('vendor_id', $vendor->id)
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('request_type'), fn ($q, $t) => $q->where('request_type', $t))
            ->when($request->input('search'), fn ($q, $search) => $q
                ->where(fn ($q) => $q
                    ->where('return_number', 'like', "%{$search}%")
                    ->orWhereHas('orderItem', fn ($q) => $q->where('product_name', 'like', "%{$search}%"))
                )
            )
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            VendorReturnResource::collection($returns),
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
        $vendor = $this->vendorFor($request);

        $relations = $this->returnRelations(['user', 'orderItem.product', 'order']);
        if (Schema::hasTable('return_status_history')) {
            $relations[] = 'statusHistory.changedBy';
        }

        $return = ReturnRequest::query()
            ->with($relations)
            ->where('uuid', $returnId)
            ->where('vendor_id', $vendor->id)
            ->first();

        if (! $return) {
            return Response::error('Return not found.', [], 404);
        }

        return Response::success(new VendorReturnResource($return), 'Return retrieved.');
    }

    // ─── STEP 5: Approve / reject ─────────────────────────────────────────

    public function approve(Request $request, string $returnId): JsonResponse
    {
        $request->validate([
            'notes'               => ['nullable', 'string', 'max:1000'],
            'return_method'       => ['nullable', Rule::in(['pickup', 'drop_off'])],
            'pickup_instructions' => ['nullable', 'string', 'max:2000'],
        ]);

        $return = $this->findForVendor($request, $returnId);

        try {
            $return = $this->returnService->approve(
                $return,
                $request->user(),
                $request->input('notes', ''),
                $request->input('return_method'),
                $request->input('pickup_instructions')
            );

            return Response::success(new VendorReturnResource($return->load(['user', 'orderItem', 'statusHistory'])), 'Return approved.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    public function reject(Request $request, string $returnId): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:1000']]);

        $return = $this->findForVendor($request, $returnId);

        try {
            $return = $this->returnService->reject($return, $request->user(), $request->input('reason'));

            return Response::success(new VendorReturnResource($return->load(['user', 'orderItem', 'statusHistory'])), 'Return rejected.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    // ─── STEP 6: Mark product collected ──────────────────────────────────

    public function markCollected(Request $request, string $returnId): JsonResponse
    {
        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        $return = $this->findForVendor($request, $returnId);

        try {
            $return = $this->returnService->markCollected($return, $request->user(), $request->input('notes', ''));

            return Response::success(new VendorReturnResource($return->load(['user', 'orderItem', 'statusHistory'])), 'Product marked as collected.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    // ─── STEP 7: Inspect the returned product ────────────────────────────

    public function inspect(Request $request, string $returnId): JsonResponse
    {
        $request->validate([
            'condition'           => ['required', Rule::in(['good', 'damaged', 'defective', 'missing_parts'])],
            'notes'               => ['required', 'string', 'max:2000'],
            'inspection_photos'   => ['nullable', 'array', 'max:8'],
            'inspection_photos.*' => ['file', 'max:20480', 'mimes:jpg,jpeg,png,webp'],
        ]);

        $return = $this->findForVendor($request, $returnId);

        try {
            $return = $this->returnService->recordInspection(
                $return,
                $request->user(),
                $request->input('condition'),
                $request->input('notes'),
                $request->file('inspection_photos', [])
            );

            return Response::success(new VendorReturnResource($return->load(['user', 'orderItem', 'statusHistory'])), 'Inspection recorded.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    // ─── STEP 8: Dispatch replacement ────────────────────────────────────

    public function dispatchReplacement(Request $request, string $returnId): JsonResponse
    {
        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        $return = $this->findForVendor($request, $returnId);

        try {
            $return = $this->returnService->dispatchReplacement($return, $request->user(), $request->input('notes', ''));

            return Response::success(new VendorReturnResource($return->load(['user', 'orderItem', 'statusHistory'])), 'Replacement dispatched.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    // ─── Generic status update (kept for backwards compat) ────────────────

    public function updateStatus(Request $request, string $returnId): JsonResponse
    {
        $request->validate([
            'status'   => ['required', Rule::enum(ReturnStatus::class)],
            'response' => ['nullable', 'string', 'max:1000'],
        ]);

        $return = $this->findForVendor($request, $returnId);

        try {
            $return = $this->returnService->updateStatus(
                $return,
                $request->user(),
                ReturnStatus::from($request->input('status')),
                $request->input('response', '')
            );

            return Response::success(new VendorReturnResource($return->load(['user', 'orderItem', 'statusHistory'])), 'Return status updated.');
        } catch (DomainException $e) {
            return Response::error($e->getMessage(), $e->getErrors(), $e->getStatusCode());
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    protected function findForVendor(Request $request, string $returnId): ReturnRequest
    {
        $vendor = $this->vendorFor($request);

        $return = ReturnRequest::query()
            ->where('uuid', $returnId)
            ->where('vendor_id', $vendor->id)
            ->first();

        if (! $return) {
            throw new DomainException('Return not found.', [], 404);
        }

        return $return;
    }

    protected function vendorFor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            throw new DomainException('You must have a vendor account to access returns.', [], 403);
        }

        return $vendor;
    }

    private function returnRelations(array $baseRelations = []): array
    {
        $this->ensureSupportingTablesExist();

        $relations = $baseRelations;
        if (Schema::hasTable('return_request_media')) {
            $relations[] = 'media';
        }
        if (Schema::hasTable('return_status_history')) {
            $relations[] = 'statusHistory';
        }

        return $relations;
    }

    private function ensureSupportingTablesExist(): void
    {
        try {
            if (! Schema::hasTable('return_request_media')) {
                Schema::create('return_request_media', function (Blueprint $table) {
                    $table->id();
                    $table->uuid()->unique();
                    $table->foreignId('return_request_id')->constrained()->cascadeOnDelete();
                    $table->string('type', 20)->default('photo');
                    $table->string('path', 500);
                    $table->string('mime_type', 100)->nullable();
                    $table->unsignedBigInteger('size')->nullable();
                    $table->string('original_name', 255)->nullable();
                    $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                    $table->timestamps();
                    $table->index('return_request_id');
                });
            }

            if (! Schema::hasTable('return_status_history')) {
                Schema::create('return_status_history', function (Blueprint $table) {
                    $table->id();
                    $table->foreignId('return_request_id')->constrained()->cascadeOnDelete();
                    $table->string('from_status', 30)->nullable();
                    $table->string('to_status', 30);
                    $table->text('notes')->nullable();
                    $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
                    $table->timestamps();
                    $table->index('return_request_id');
                });
            }
        } catch (\Throwable) {
            // Fail safe without interrupting read workflows
        }
    }
}
