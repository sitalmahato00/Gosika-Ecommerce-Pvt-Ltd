<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketing\Infrastructure\Models\Banner;
use App\Modules\Marketing\Presentation\Resources\BannerResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminBannerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
        $this->middleware('permission:'.Permissions::BANNERS_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $banners = Banner::query()
            ->when($request->input('status'), function ($q, $status) {
                $q->where('is_active', $status === 'active');
            })
            ->when($request->input('search'), fn ($q, $s) => $q->where('title', 'like', "%{$s}%"))
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 50));

        return Response::success(
            BannerResource::collection($banners),
            'Banners retrieved.',
            ['pagination' => [
                'total' => $banners->total(),
                'per_page' => $banners->perPage(),
                'current_page' => $banners->currentPage(),
                'last_page' => $banners->lastPage(),
            ]]
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['required', 'string', 'max:500'],
            'link' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $banner = Banner::create($data);

        app(AuditLogService::class)->record($request->user(), 'banner.created', 'banner', $banner->uuid, null, ['title' => $banner->title]);

        return Response::created(new BannerResource($banner), 'Banner created.');
    }

    public function update(Request $request, string $bannerId): JsonResponse
    {
        $banner = Banner::where('uuid', $bannerId)->firstOrFail();

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['sometimes', 'required', 'string', 'max:500'],
            'link' => ['nullable', 'string', 'max:500'],
            'position' => ['nullable', 'string', 'max:30'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
        ]);

        $banner->update($data);

        app(AuditLogService::class)->record($request->user(), 'banner.updated', 'banner', $banner->uuid, null, ['title' => $banner->title]);

        return Response::success(new BannerResource($banner->fresh()), 'Banner updated.');
    }

    public function destroy(Request $request, string $bannerId): JsonResponse
    {
        $banner = Banner::where('uuid', $bannerId)->firstOrFail();
        app(AuditLogService::class)->record($request->user(), 'banner.deleted', 'banner', $banner->uuid, null, ['title' => $banner->title]);
        $banner->delete();

        return Response::success(null, 'Banner deleted.');
    }
}
