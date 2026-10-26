<?php

namespace App\Modules\Seo\Presentation\Http\Controllers;

use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Seo\Application\Services\SeoService;
use App\Modules\Seo\Infrastructure\Models\SeoAuditResult;
use App\Modules\Seo\Infrastructure\Models\SeoKeyword;
use App\Modules\Seo\Infrastructure\Models\SeoMeta;
use App\Modules\Seo\Infrastructure\Models\SeoRedirect;
use App\Modules\Seo\Infrastructure\Models\SeoTemplate;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminSeoController extends Controller
{
    public function __construct(
        protected SeoService $seoService
    ) {
        $this->middleware('auth:sanctum');
        $this->middleware('ensure:admin');
    }

    /**
     * Dashboard summary.
     */
    public function dashboard(): JsonResponse
    {
        $metaCounts = SeoMeta::selectRaw('entity_type, count(*) as count')
            ->groupBy('entity_type')
            ->pluck('count', 'entity_type')
            ->toArray();

        $summary = [
            'meta_counts'      => $metaCounts,
            'meta_total'       => array_sum($metaCounts),
            'redirect_count'   => SeoRedirect::where('is_active', true)->count(),
            'template_count'   => SeoTemplate::where('is_active', true)->count(),
            'keyword_count'    => SeoKeyword::where('is_active', true)->count(),
            'audit_summary'    => $this->seoService->getAuditSummary(),
        ];

        return Response::success($summary, 'SEO dashboard data retrieved.');
    }

    /**
     * Get global SEO settings.
     */
    public function getGlobalSettings(): JsonResponse
    {
        $settings = $this->seoService->getSeoSettings();
        return Response::success($settings, 'SEO settings retrieved.');
    }

    /**
     * Update global SEO settings.
     */
    public function updateGlobalSettings(Request $request): JsonResponse
    {
        // Use escaped dot keys so Laravel treats them as literals, not nested array paths
        $request->validate([
            'seo\\.default_title_suffix'    => ['nullable', 'string', 'max:100'],
            'seo\\.title_separator'         => ['nullable', 'string', 'max:20'],
            'seo\\.default_robots'          => ['nullable', 'string', 'max:60'],
            'seo\\.twitter_card'            => ['nullable', 'string', 'in:summary,summary_large_image'],
            'seo\\.google_verification'     => ['nullable', 'string', 'max:200'],
            'seo\\.bing_verification'       => ['nullable', 'string', 'max:200'],
            'seo\\.yandex_verification'     => ['nullable', 'string', 'max:200'],
            'seo\\.product_title_template'  => ['nullable', 'string', 'max:300'],
            'seo\\.category_title_template' => ['nullable', 'string', 'max:300'],
            'seo\\.store_title_template'    => ['nullable', 'string', 'max:300'],
        ]);

        $allowed = [
            'seo.default_title_suffix',
            'seo.title_separator',
            'seo.default_robots',
            'seo.twitter_card',
            'seo.google_verification',
            'seo.bing_verification',
            'seo.yandex_verification',
            'seo.product_title_template',
            'seo.category_title_template',
            'seo.store_title_template',
        ];

        // Grab the raw flat keys from the request body directly
        $payload = $request->only($allowed);

        foreach ($payload as $key => $value) {
            Setting::set($key, $value ?? '', 'seo');
        }

        return Response::success($this->seoService->getSeoSettings(), 'SEO settings updated.');
    }

    /**
     * List seo_meta records.
     */
    public function getMeta(Request $request): JsonResponse
    {
        $query = SeoMeta::query()
            ->when($request->input('entity_type'), fn ($q, $v) => $q->where('entity_type', $v))
            ->when($request->input('search'), fn ($q, $s) => $q->where('meta_title', 'like', "%{$s}%"))
            ->orderBy('created_at', 'desc');

        $paginated = $query->paginate($request->integer('per_page', 20));

        return Response::success($paginated->items(), 'SEO meta records retrieved.', [
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Create or update SeoMeta for entity_type + entity_id.
     */
    public function upsertMeta(Request $request): JsonResponse
    {
        $data = $request->validate([
            'entity_type'         => ['required', 'string', 'max:50'],
            'entity_id'           => ['nullable', 'integer'],
            'meta_title'          => ['nullable', 'string', 'max:200'],
            'meta_description'    => ['nullable', 'string', 'max:500'],
            'meta_keywords'       => ['nullable', 'string', 'max:500'],
            'canonical_url'       => ['nullable', 'string', 'max:500'],
            'robots'              => ['nullable', 'string', 'max:100'],
            'og_title'            => ['nullable', 'string', 'max:200'],
            'og_description'      => ['nullable', 'string', 'max:500'],
            'og_image'            => ['nullable', 'string', 'max:500'],
            'twitter_card'        => ['nullable', 'string', 'max:20'],
            'twitter_title'       => ['nullable', 'string', 'max:200'],
            'twitter_description' => ['nullable', 'string', 'max:500'],
            'is_noindex'          => ['nullable', 'boolean'],
            'is_nofollow'         => ['nullable', 'boolean'],
            'structured_data'     => ['nullable', 'array'],
        ]);

        $record = SeoMeta::updateOrCreate(
            [
                'entity_type' => $data['entity_type'],
                'entity_id'   => $data['entity_id'] ?? null,
            ],
            $data
        );

        return Response::success($record, $record->wasRecentlyCreated ? 'SEO meta created.' : 'SEO meta updated.');
    }

    /**
     * Delete a SeoMeta record by id.
     */
    public function deleteMeta(int $id): JsonResponse
    {
        $record = SeoMeta::findOrFail($id);
        $record->delete();
        return Response::success(null, 'SEO meta deleted.');
    }

    /**
     * List all templates.
     */
    public function getTemplates(): JsonResponse
    {
        $templates = SeoTemplate::orderBy('entity_type')->orderBy('name')->get();
        return Response::success($templates, 'SEO templates retrieved.');
    }

    /**
     * Create or update a template.
     */
    public function upsertTemplate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id'                   => ['nullable', 'integer', 'exists:seo_templates,id'],
            'entity_type'          => ['required', 'string', 'in:product,category,store,page'],
            'name'                 => ['required', 'string', 'max:100'],
            'title_template'       => ['required', 'string', 'max:300'],
            'description_template' => ['nullable', 'string', 'max:600'],
            'is_default'           => ['nullable', 'boolean'],
            'is_active'            => ['nullable', 'boolean'],
        ]);

        // If setting as default, unset others for this entity_type
        if (! empty($data['is_default'])) {
            SeoTemplate::where('entity_type', $data['entity_type'])
                ->when(! empty($data['id']), fn ($q) => $q->where('id', '!=', $data['id']))
                ->update(['is_default' => false]);
        }

        if (! empty($data['id'])) {
            $template = SeoTemplate::findOrFail($data['id']);
            $template->update($data);
            return Response::success($template->fresh(), 'Template updated.');
        }

        $template = SeoTemplate::create($data);
        return Response::created($template, 'Template created.');
    }

    /**
     * Delete a template.
     */
    public function deleteTemplate(int $id): JsonResponse
    {
        SeoTemplate::findOrFail($id)->delete();
        return Response::success(null, 'Template deleted.');
    }

    /**
     * Paginated keyword list.
     */
    public function getKeywords(Request $request): JsonResponse
    {
        $query = SeoKeyword::query()
            ->when($request->input('language'), fn ($q, $v) => $q->where('language', $v))
            ->when($request->input('search_intent'), fn ($q, $v) => $q->where('search_intent', $v))
            ->when($request->input('entity_type'), fn ($q, $v) => $q->where('entity_type', $v))
            ->when($request->input('search'), fn ($q, $s) => $q->where('keyword', 'like', "%{$s}%"))
            ->orderBy('priority', 'desc')
            ->orderBy('keyword');

        $paginated = $query->paginate($request->integer('per_page', 25));

        return Response::success($paginated->items(), 'Keywords retrieved.', [
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Create or update a keyword.
     */
    public function upsertKeyword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id'            => ['nullable', 'integer', 'exists:seo_keywords,id'],
            'keyword'       => ['required', 'string', 'max:200'],
            'language'      => ['nullable', 'string', 'max:10'],
            'search_intent' => ['nullable', 'string', 'in:informational,navigational,transactional,commercial'],
            'entity_type'   => ['nullable', 'string', 'max:50'],
            'priority'      => ['nullable', 'integer', 'min:1', 'max:10'],
            'notes'         => ['nullable', 'string'],
            'is_active'     => ['nullable', 'boolean'],
        ]);

        if (! empty($data['id'])) {
            $keyword = SeoKeyword::findOrFail($data['id']);
            $keyword->update($data);
            return Response::success($keyword->fresh(), 'Keyword updated.');
        }

        $keyword = SeoKeyword::create($data);
        return Response::created($keyword, 'Keyword created.');
    }

    /**
     * Delete a keyword.
     */
    public function deleteKeyword(int $id): JsonResponse
    {
        SeoKeyword::findOrFail($id)->delete();
        return Response::success(null, 'Keyword deleted.');
    }

    /**
     * Paginated redirect list.
     */
    public function getRedirects(Request $request): JsonResponse
    {
        $query = SeoRedirect::query()
            ->when($request->input('is_active') !== null, fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($request->input('search'), fn ($q, $s) => $q->where('source_path', 'like', "%{$s}%")->orWhere('target_path', 'like', "%{$s}%"))
            ->orderBy('created_at', 'desc');

        $paginated = $query->paginate($request->integer('per_page', 20));

        return Response::success($paginated->items(), 'Redirects retrieved.', [
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Create or update a redirect with loop detection.
     */
    public function upsertRedirect(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id'            => ['nullable', 'integer', 'exists:seo_redirects,id'],
            'source_path'   => ['required', 'string', 'max:500'],
            'target_path'   => ['required', 'string', 'max:500'],
            'redirect_type' => ['nullable', 'integer', 'in:301,302'],
            'is_active'     => ['nullable', 'boolean'],
            'notes'         => ['nullable', 'string', 'max:255'],
        ]);

        // Loop detection: check if the target_path is itself a source in the redirects table
        $loopCheck = SeoRedirect::where('source_path', $data['target_path'])
            ->when(! empty($data['id']), fn ($q) => $q->where('id', '!=', $data['id']))
            ->where('is_active', true)
            ->exists();

        if ($loopCheck) {
            return Response::error(
                'Redirect loop detected: the target path is already a redirect source.',
                ['target_path' => ['The target would create a redirect loop.']],
                422
            );
        }

        if (! empty($data['id'])) {
            $redirect = SeoRedirect::findOrFail($data['id']);
            $redirect->update($data);
            return Response::success($redirect->fresh(), 'Redirect updated.');
        }

        $redirect = SeoRedirect::create($data);
        return Response::created($redirect, 'Redirect created.');
    }

    /**
     * Delete a redirect.
     */
    public function deleteRedirect(int $id): JsonResponse
    {
        SeoRedirect::findOrFail($id)->delete();
        return Response::success(null, 'Redirect deleted.');
    }

    /**
     * Paginated audit results, filterable.
     */
    public function getAuditResults(Request $request): JsonResponse
    {
        $query = SeoAuditResult::query()
            ->when($request->input('severity'), fn ($q, $v) => $q->where('severity', $v))
            ->when($request->input('entity_type'), fn ($q, $v) => $q->where('entity_type', $v))
            ->when($request->input('is_resolved') !== null, fn ($q) => $q->where('is_resolved', $request->boolean('is_resolved')))
            ->orderBy('severity')
            ->orderBy('created_at', 'desc');

        $paginated = $query->paginate($request->integer('per_page', 25));

        return Response::success($paginated->items(), 'Audit results retrieved.', [
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Run the SEO audit.
     */
    public function runAudit(Request $request): JsonResponse
    {
        $entityType = $request->input('entity_type', 'all');
        $result = $this->seoService->runAudit($entityType);
        $summary = $this->seoService->getAuditSummary();

        return Response::success([
            'run_result' => $result,
            'summary'    => $summary,
        ], 'SEO audit completed.');
    }

    /**
     * Resolve an audit item.
     */
    public function resolveAuditItem(int $id): JsonResponse
    {
        $item = SeoAuditResult::findOrFail($id);
        $item->update([
            'is_resolved' => true,
            'resolved_at' => now(),
        ]);

        return Response::success($item->fresh(), 'Audit item marked as resolved.');
    }

    /**
     * Returns sitemap index data.
     */
    public function getSitemapIndex(): JsonResponse
    {
        $baseUrl = rtrim(config('app.url', ''), '/');
        $apiBase = $baseUrl . '/api/v1/seo';

        $sitemaps = [
            ['type' => 'products',   'url' => $apiBase . '/sitemap/products.xml'],
            ['type' => 'categories', 'url' => $apiBase . '/sitemap/categories.xml'],
            ['type' => 'stores',     'url' => $apiBase . '/sitemap/stores.xml'],
            ['type' => 'pages',      'url' => $apiBase . '/sitemap/pages.xml'],
        ];

        return Response::success([
            'sitemap_index_url' => $apiBase . '/sitemap.xml',
            'sitemaps'          => $sitemaps,
        ], 'Sitemap index data retrieved.');
    }

    /**
     * Get current robots.txt content.
     */
    public function getRobotsTxt(): JsonResponse
    {
        $content = Setting::get('seo.robots_txt', "User-agent: *\nAllow: /\nDisallow: /admin/\n");
        return Response::success(['content' => $content], 'Robots.txt retrieved.');
    }

    /**
     * Update robots.txt content.
     */
    public function updateRobotsTxt(Request $request): JsonResponse
    {
        $data = $request->validate([
            'content' => ['required', 'string', 'max:10000'],
        ]);

        Setting::set('seo.robots_txt', $data['content'], 'seo');

        return Response::success(['content' => $data['content']], 'Robots.txt updated.');
    }
}
