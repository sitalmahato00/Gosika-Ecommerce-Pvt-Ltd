<?php

namespace App\Modules\Marketing\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Marketing\Infrastructure\Models\CmsPage;
use App\Modules\Marketing\Presentation\Resources\CmsPageResource;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Str;

class AdminCmsPageController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::PAGES_MANAGE);
    }

    public function index(Request $request): JsonResponse
    {
        $pages = CmsPage::query()
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('type'), fn ($q, $type) => $q->where('type', $type))
            ->when($request->input('search'), fn ($q, $s) => $q->where('title', 'like', "%{$s}%")->orWhere('slug', 'like', "%{$s}%"))
            ->orderBy('sort_order')
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            CmsPageResource::collection($pages),
            'Pages retrieved.',
            ['pagination' => [
                'total' => $pages->total(),
                'per_page' => $pages->perPage(),
                'current_page' => $pages->currentPage(),
                'last_page' => $pages->lastPage(),
            ]]
        );
    }

    public function stats(): JsonResponse
    {
        $counts = [
            'total' => CmsPage::count(),
            'published' => CmsPage::where('status', 'published')->count(),
            'draft' => CmsPage::where('status', 'draft')->count(),
            'policy' => CmsPage::where('type', 'policy')->count(),
            'page' => CmsPage::where('type', 'page')->count(),
        ];

        return Response::success($counts, 'Page stats.');
    }

    public function show(string $pageId): JsonResponse
    {
        $page = CmsPage::where('uuid', $pageId)->firstOrFail();

        return Response::success(new CmsPageResource($page), 'Page retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200', 'unique:cms_pages,slug'],
            'excerpt' => ['nullable', 'string', 'max:400'],
            'body' => ['nullable', 'string'],
            'type' => ['required', 'in:page,policy'],
            'status' => ['required', 'in:draft,published'],
            'meta' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $data['slug'] = ($data['slug'] ?? '') ?: Str::slug($data['title']);
        $page = CmsPage::create($data);

        app(AuditLogService::class)->record($request->user(), 'page.created', 'cms_page', $page->uuid, null, ['title' => $page->title]);

        return Response::created(new CmsPageResource($page), 'Page created.');
    }

    public function update(Request $request, string $pageId): JsonResponse
    {
        $page = CmsPage::where('uuid', $pageId)->firstOrFail();

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:180'],
            'slug' => ['nullable', 'string', 'max:200', 'unique:cms_pages,slug,'.$page->id],
            'excerpt' => ['nullable', 'string', 'max:400'],
            'body' => ['nullable', 'string'],
            'type' => ['sometimes', 'required', 'in:page,policy'],
            'status' => ['sometimes', 'required', 'in:draft,published'],
            'meta' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        if (empty($data['slug']) && isset($data['title'])) {
            $data['slug'] = Str::slug($data['title']);
        }
        $page->update($data);

        app(AuditLogService::class)->record($request->user(), 'page.updated', 'cms_page', $page->uuid, null, ['title' => $page->title]);

        return Response::success(new CmsPageResource($page->fresh()), 'Page updated.');
    }

    public function destroy(Request $request, string $pageId): JsonResponse
    {
        $page = CmsPage::where('uuid', $pageId)->firstOrFail();
        app(AuditLogService::class)->record($request->user(), 'page.deleted', 'cms_page', $page->uuid, null, ['title' => $page->title]);
        $page->delete();

        return Response::success(null, 'Page deleted.');
    }
}