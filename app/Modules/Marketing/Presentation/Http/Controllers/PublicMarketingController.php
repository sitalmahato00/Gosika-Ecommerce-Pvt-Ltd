<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Marketing\Infrastructure\Models\Banner;
use App\Modules\Marketing\Infrastructure\Models\Campaign;
use App\Modules\Marketing\Infrastructure\Models\CmsPage;
use App\Modules\Marketing\Presentation\Resources\BannerResource;
use App\Modules\Marketing\Presentation\Resources\CampaignResource;
use App\Modules\Marketing\Presentation\Resources\CmsPageResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class PublicMarketingController extends Controller
{
    public function banners(): JsonResponse
    {
        $banners = Banner::where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('starts_at')->orWhere('starts_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('ends_at')->orWhere('ends_at', '>=', now());
            })
            ->orderBy('sort_order')
            ->get();

        return Response::success(BannerResource::collection($banners), 'Active banners.');
    }

    public function campaigns(): JsonResponse
    {
        $campaigns = Campaign::where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', now());
            })
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return Response::success(CampaignResource::collection($campaigns), 'Active campaigns.');
    }

    public function pages(): JsonResponse
    {
        $pages = CmsPage::where('status', 'published')
            ->orderBy('sort_order')
            ->get();

        return Response::success(CmsPageResource::collection($pages), 'Published pages.');
    }

    public function pageBySlug(string $slug): JsonResponse
    {
        $page = CmsPage::where('slug', $slug)->where('status', 'published')->firstOrFail();

        return Response::success(new CmsPageResource($page), 'Page retrieved.');
    }
}