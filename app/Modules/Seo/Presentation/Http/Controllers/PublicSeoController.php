<?php

namespace App\Modules\Seo\Presentation\Http\Controllers;

use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Seo\Application\Services\SeoService;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\Controller;

class PublicSeoController extends Controller
{
    public function __construct(
        protected SeoService $seoService
    ) {
    }

    /**
     * Public endpoint — returns resolved SEO data for entity_type + entity_id.
     */
    public function entityMeta(Request $request): JsonResponse
    {
        $request->validate([
            'entity_type' => ['required', 'string', 'max:50'],
            'entity_id'   => ['nullable', 'integer'],
        ]);

        $entityType = $request->input('entity_type');
        $entityId   = $request->input('entity_id') ? (int) $request->input('entity_id') : null;

        $seoData = $this->seoService->getPublicSeoData($entityType, $entityId);

        return Response::success($seoData, 'SEO data retrieved.');
    }

    /**
     * Returns XML sitemap for a given type.
     */
    public function sitemap(string $type): HttpResponse
    {
        $allowedTypes = ['products', 'categories', 'stores', 'pages'];

        if (! in_array($type, $allowedTypes, true)) {
            abort(404);
        }

        $urls = $this->seoService->getSitemapData($type);

        $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($urls as $entry) {
            $xml .= "  <url>\n";
            $xml .= '    <loc>' . htmlspecialchars($entry['loc'], ENT_XML1, 'UTF-8') . "</loc>\n";

            if (! empty($entry['lastmod'])) {
                $xml .= '    <lastmod>' . htmlspecialchars($entry['lastmod'], ENT_XML1, 'UTF-8') . "</lastmod>\n";
            }
            if (! empty($entry['changefreq'])) {
                $xml .= '    <changefreq>' . htmlspecialchars($entry['changefreq'], ENT_XML1, 'UTF-8') . "</changefreq>\n";
            }
            if (! empty($entry['priority'])) {
                $xml .= '    <priority>' . htmlspecialchars($entry['priority'], ENT_XML1, 'UTF-8') . "</priority>\n";
            }

            $xml .= "  </url>\n";
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
        ]);
    }

    /**
     * Returns sitemap index XML.
     */
    public function sitemapIndex(): HttpResponse
    {
        $baseUrl = rtrim(config('app.url', ''), '/');
        $apiBase = $baseUrl . '/api/v1/seo';

        $types = ['products', 'categories', 'stores', 'pages'];

        $xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

        foreach ($types as $type) {
            $xml .= "  <sitemap>\n";
            $xml .= '    <loc>' . htmlspecialchars("{$apiBase}/sitemap/{$type}.xml", ENT_XML1, 'UTF-8') . "</loc>\n";
            $xml .= '    <lastmod>' . now()->toAtomString() . "</lastmod>\n";
            $xml .= "  </sitemap>\n";
        }

        $xml .= '</sitemapindex>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
        ]);
    }

    /**
     * Returns robots.txt content as text/plain.
     */
    public function robotsTxt(): HttpResponse
    {
        $content = Setting::get('seo.robots_txt', "User-agent: *\nAllow: /\nDisallow: /admin/\n");

        // Replace {app_url} placeholder
        $content = str_replace('{app_url}', rtrim(config('app.url', ''), '/'), $content);

        return response($content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
