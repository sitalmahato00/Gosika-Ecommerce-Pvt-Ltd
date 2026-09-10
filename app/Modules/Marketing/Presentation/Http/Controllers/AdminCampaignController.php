<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketing\Infrastructure\Models\Campaign;
use App\Modules\Marketing\Presentation\Resources\CampaignResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminCampaignController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::CAMPAIGNS_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $campaigns = Campaign::query()
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($request->input('search'), fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            CampaignResource::collection($campaigns),
            'Campaigns retrieved.',
            ['pagination' => [
                'total' => $campaigns->total(),
                'per_page' => $campaigns->perPage(),
                'current_page' => $campaigns->currentPage(),
                'last_page' => $campaigns->lastPage(),
            ]]
        );
    }

    public function stats(): JsonResponse
    {
        $counts = [
            'total' => Campaign::count(),
            'draft' => Campaign::where('status', 'draft')->count(),
            'scheduled' => Campaign::where('status', 'scheduled')->count(),
            'active' => Campaign::where('status', 'active')->count(),
            'paused' => Campaign::where('status', 'paused')->count(),
            'ended' => Campaign::where('status', 'ended')->count(),
        ];

        return Response::success($counts, 'Campaign stats.');
    }

    public function show(string $campaignId): JsonResponse
    {
        $campaign = Campaign::where('uuid', $campaignId)->firstOrFail();

        return Response::success(new CampaignResource($campaign), 'Campaign retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'tagline' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:600'],
            'type' => ['required', 'in:promo,flash_sale,discount,bundle,free_shipping,special'],
            'target_type' => ['nullable', 'in:all,store,category,product'],
            'target_ids' => ['nullable', 'array'],
            'discount_type' => ['nullable', 'in:percentage,fixed'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', 'in:draft,scheduled,active,paused,ended'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $data['created_by'] = $request->user()?->id;
        $campaign = Campaign::create($data);

        app(AuditLogService::class)->record($request->user(), 'campaign.created', 'campaign', $campaign->uuid, null, ['title' => $campaign->title]);

        return Response::created(new CampaignResource($campaign), 'Campaign created.');
    }

    public function update(Request $request, string $campaignId): JsonResponse
    {
        $campaign = Campaign::where('uuid', $campaignId)->firstOrFail();

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:200'],
            'tagline' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'string', 'max:600'],
            'type' => ['sometimes', 'required', 'in:promo,flash_sale,discount,bundle,free_shipping,special'],
            'target_type' => ['nullable', 'in:all,store,category,product'],
            'target_ids' => ['nullable', 'array'],
            'discount_type' => ['nullable', 'in:percentage,fixed'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'min_order_amount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', 'in:draft,scheduled,active,paused,ended'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ]);

        $campaign->update($data);

        app(AuditLogService::class)->record($request->user(), 'campaign.updated', 'campaign', $campaign->uuid, null, ['title' => $campaign->title]);

        return Response::success(new CampaignResource($campaign->fresh()), 'Campaign updated.');
    }

    public function updateStatus(Request $request, string $campaignId): JsonResponse
    {
        $campaign = Campaign::where('uuid', $campaignId)->firstOrFail();
        $data = $request->validate(['status' => ['required', 'in:draft,scheduled,active,paused,ended']]);
        $campaign->update($data);

        app(AuditLogService::class)->record($request->user(), 'campaign.status', 'campaign', $campaign->uuid, null, ['status' => $data['status']]);

        return Response::success(new CampaignResource($campaign->fresh()), 'Campaign status updated.');
    }

    public function destroy(Request $request, string $campaignId): JsonResponse
    {
        $campaign = Campaign::where('uuid', $campaignId)->firstOrFail();
        app(AuditLogService::class)->record($request->user(), 'campaign.deleted', 'campaign', $campaign->uuid, null, ['title' => $campaign->title]);
        $campaign->delete();

        return Response::success(null, 'Campaign deleted.');
    }
}