<?php

namespace App\Modules\Seo\Application\Services;

use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Marketing\Infrastructure\Models\CmsPage;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Seo\Infrastructure\Models\SeoAuditResult;
use App\Modules\Seo\Infrastructure\Models\SeoMeta;
use App\Modules\Seo\Infrastructure\Models\SeoTemplate;
use App\Modules\Vendor\Infrastructure\Models\Store;
use Illuminate\Support\Str;

class SeoService
{
    /**
     * Load SeoMeta for an entity and return as array.
     */
    public function getMetaForEntity(string $entityType, int|null $entityId): array
    {
        $query = SeoMeta::where('entity_type', $entityType);

        if ($entityId === null) {
            $query->whereNull('entity_id');
        } else {
            $query->where('entity_id', $entityId);
        }

        $record = $query->first();

        if (! $record) {
            return [];
        }

        return $record->toArray();
    }

    /**
     * Resolve a title template for an entity.
     */
    public function resolveTitle(string $entityType, mixed $entity, string $template = null): string
    {
        if ($template === null) {
            $settingKey = match ($entityType) {
                'product'  => 'seo.product_title_template',
                'category' => 'seo.category_title_template',
                'store'    => 'seo.store_title_template',
                default    => null,
            };
            $template = $settingKey ? Setting::get($settingKey, '') : '';
        }

        if (empty($template)) {
            return is_object($entity) ? ($entity->name ?? '') : '';
        }

        $vars = $this->buildEntityVars($entityType, $entity);

        return $this->renderTemplate($template, $vars);
    }

    /**
     * Resolve a description template for an entity.
     */
    public function resolveDescription(string $entityType, mixed $entity, string $template = null): string
    {
        if ($template !== null) {
            $vars = $this->buildEntityVars($entityType, $entity);
            return $this->renderTemplate($template, $vars);
        }

        // Fall back to entity description
        if (is_object($entity)) {
            return $entity->description ?? $entity->short_description ?? $entity->excerpt ?? '';
        }

        return '';
    }

    /**
     * Get the default active template for an entity type.
     */
    public function getDefaultTemplate(string $entityType): ?SeoTemplate
    {
        return SeoTemplate::where('entity_type', $entityType)
            ->where('is_default', true)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Replace {var_name} placeholders in a template string.
     */
    public function renderTemplate(string $template, array $vars): string
    {
        foreach ($vars as $key => $value) {
            $template = str_replace('{' . $key . '}', (string) ($value ?? ''), $template);
        }

        return trim($template);
    }

    /**
     * Returns fully resolved SEO data merging templates + overrides + global settings.
     */
    public function getPublicSeoData(string $entityType, int|null $entityId, mixed $entity = null): array
    {
        $settings  = $this->getSeoSettings();
        $titleSuffix = $settings['seo.title_suffix'] ?? $settings['seo.default_title_suffix'] ?? ' | GOSIKA';
        $separator   = $settings['seo.title_separator'] ?? $settings['seo.default_title_separator'] ?? ' | ';

        // Start with defaults
        $seo = [
            'meta_title'          => '',
            'meta_description'    => '',
            'meta_keywords'       => '',
            'canonical_url'       => null,
            'robots'              => $settings['seo.default_robots'] ?? 'index,follow',
            'og_title'            => '',
            'og_description'      => '',
            'og_image'            => null,
            'twitter_card'        => $settings['seo.twitter_card'] ?? 'summary_large_image',
            'twitter_title'       => '',
            'twitter_description' => '',
            'is_noindex'          => false,
            'is_nofollow'         => false,
            'structured_data'     => null,
        ];

        // Try to resolve from entity + templates
        if ($entity !== null) {
            $defaultTemplate = $this->getDefaultTemplate($entityType);

            $resolvedTitle = $this->resolveTitle(
                $entityType,
                $entity,
                $defaultTemplate?->title_template
            );

            $resolvedDescription = $this->resolveDescription(
                $entityType,
                $entity,
                $defaultTemplate?->description_template
            );

            if (! empty($resolvedTitle)) {
                $seo['meta_title'] = $resolvedTitle;
            }

            if (! empty($resolvedDescription)) {
                $seo['meta_description'] = $resolvedDescription;
            }
        }

        // Overlay with stored SeoMeta overrides
        $override = $this->getMetaForEntity($entityType, $entityId);

        foreach ($override as $key => $value) {
            if (in_array($key, ['id', 'uuid', 'entity_type', 'entity_id', 'created_by', 'updated_by', 'created_at', 'updated_at'], true)) {
                continue;
            }
            if ($value !== null && $value !== '') {
                $seo[$key] = $value;
            }
        }

        // Apply title suffix if not already present
        if (! empty($seo['meta_title']) && ! empty($titleSuffix)) {
            if (! str_ends_with($seo['meta_title'], trim($titleSuffix))) {
                $seo['meta_title'] .= $titleSuffix;
            }
        }

        // Sync OG/Twitter if empty
        if (empty($seo['og_title'])) {
            $seo['og_title'] = $seo['meta_title'];
        }
        if (empty($seo['og_description'])) {
            $seo['og_description'] = $seo['meta_description'];
        }
        if (empty($seo['twitter_title'])) {
            $seo['twitter_title'] = $seo['meta_title'];
        }
        if (empty($seo['twitter_description'])) {
            $seo['twitter_description'] = $seo['meta_description'];
        }

        return $seo;
    }

    /**
     * Load all settings in the 'seo' group.
     */
    public function getSeoSettings(): array
    {
        $rows = Setting::where('group', 'seo')->get();
        $result = [];
        foreach ($rows as $row) {
            $result[$row->key] = $row->getDecryptedValue();
        }
        return $result;
    }

    /**
     * Run SEO audit for products, categories, stores and create SeoAuditResult records.
     */
    public function runAudit(string $entityType = 'all'): array
    {
        $counts = ['created' => 0, 'errors' => 0, 'warnings' => 0, 'info' => 0];

        if ($entityType === 'all' || $entityType === 'product') {
            $this->auditProducts($counts);
        }

        if ($entityType === 'all' || $entityType === 'category') {
            $this->auditCategories($counts);
        }

        if ($entityType === 'all' || $entityType === 'store') {
            $this->auditStores($counts);
        }

        return $counts;
    }

    /**
     * Return audit summary counts by severity.
     */
    public function getAuditSummary(): array
    {
        return [
            'error'   => SeoAuditResult::where('severity', 'error')->where('is_resolved', false)->count(),
            'warning' => SeoAuditResult::where('severity', 'warning')->where('is_resolved', false)->count(),
            'info'    => SeoAuditResult::where('severity', 'info')->where('is_resolved', false)->count(),
            'total'   => SeoAuditResult::where('is_resolved', false)->count(),
            'resolved' => SeoAuditResult::where('is_resolved', true)->count(),
        ];
    }

    /**
     * Return URL data for sitemap generation.
     */
    public function getSitemapData(string $type): array
    {
        $baseUrl = rtrim(config('app.frontend_url', config('app.url', '')), '/');

        return match ($type) {
            'products'   => $this->getSitemapProducts($baseUrl),
            'categories' => $this->getSitemapCategories($baseUrl),
            'stores'     => $this->getSitemapStores($baseUrl),
            'pages'      => $this->getSitemapPages($baseUrl),
            default      => [],
        };
    }

    // ------------------------------------------------------------------
    //  Private helpers
    // ------------------------------------------------------------------

    private function buildEntityVars(string $entityType, mixed $entity): array
    {
        $settings    = $this->getSeoSettings();
        $titleSuffix = $settings['seo.title_suffix'] ?? $settings['seo.default_title_suffix'] ?? ' | GOSIKA';
        $separator   = $settings['seo.title_separator'] ?? $settings['seo.default_title_separator'] ?? ' | ';

        $base = [
            'title_suffix' => $titleSuffix,
            'separator'    => $separator,
            'app_name'     => config('app.name', 'GOSIKA'),
            'app_url'      => config('app.url', ''),
        ];

        if (! is_object($entity)) {
            return $base;
        }

        return array_merge($base, match ($entityType) {
            'product'  => [
                'product_name'        => $entity->name ?? '',
                'product_description' => $entity->short_description ?? $entity->description ?? '',
                'product_sku'         => $entity->sku ?? '',
                'category_name'       => $entity->category?->name ?? '',
                'brand_name'          => $entity->brand?->name ?? '',
                'price'               => $entity->price ?? '',
            ],
            'category' => [
                'category_name'        => $entity->name ?? '',
                'category_description' => $entity->description ?? '',
            ],
            'store'    => [
                'store_name'        => $entity->name ?? '',
                'store_description' => $entity->description ?? '',
            ],
            'cms_page' => [
                'page_title'   => $entity->title ?? '',
                'page_excerpt' => $entity->excerpt ?? '',
            ],
            default    => [
                'name'        => $entity->name ?? $entity->title ?? '',
                'description' => $entity->description ?? '',
            ],
        });
    }

    private function createAuditResult(
        string $entityType,
        int|null $entityId,
        string $entityUrl,
        string $issueType,
        string $severity,
        string $description,
        string $recommendation,
        array &$counts
    ): void {
        // Only create if one doesn't already exist (unresolved) for this entity + issue
        $exists = SeoAuditResult::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('issue_type', $issueType)
            ->where('is_resolved', false)
            ->exists();

        if (! $exists) {
            SeoAuditResult::create([
                'entity_type'    => $entityType,
                'entity_id'      => $entityId,
                'entity_url'     => $entityUrl,
                'issue_type'     => $issueType,
                'severity'       => $severity,
                'description'    => $description,
                'recommendation' => $recommendation,
                'is_resolved'    => false,
            ]);
            $counts['created']++;
        }

        $counts[$severity] = ($counts[$severity] ?? 0) + 1;
    }

    private function auditProducts(array &$counts): void
    {
        Product::published()
            ->chunkById(200, function ($products) use (&$counts) {
                foreach ($products as $product) {
                    $url = '/products/' . $product->slug;

                    // Check missing meta_title
                    $metaTitle = $product->meta['meta_title'] ?? null;
                    if (empty($metaTitle)) {
                        $this->createAuditResult(
                            'product',
                            $product->id,
                            $url,
                            'missing_meta_title',
                            'warning',
                            "Product \"{$product->name}\" (ID: {$product->id}) is missing a meta title.",
                            'Add a descriptive meta title to improve search engine visibility.',
                            $counts
                        );
                    }

                    // Check missing description
                    if (empty($product->description) && empty($product->short_description)) {
                        $this->createAuditResult(
                            'product',
                            $product->id,
                            $url,
                            'missing_description',
                            'warning',
                            "Product \"{$product->name}\" (ID: {$product->id}) has no description.",
                            'Add a product description to improve SEO and user experience.',
                            $counts
                        );
                    }

                    // Check missing images
                    if ($product->images()->count() === 0) {
                        $this->createAuditResult(
                            'product',
                            $product->id,
                            $url,
                            'missing_images',
                            'error',
                            "Product \"{$product->name}\" (ID: {$product->id}) has no images.",
                            'Add at least one product image to improve CTR and conversions.',
                            $counts
                        );
                    }
                }
            });
    }

    private function auditCategories(array &$counts): void
    {
        Category::active()
            ->chunkById(200, function ($categories) use (&$counts) {
                foreach ($categories as $category) {
                    $url = '/category/' . $category->slug;

                    if (empty($category->description)) {
                        $this->createAuditResult(
                            'category',
                            $category->id,
                            $url,
                            'missing_description',
                            'info',
                            "Category \"{$category->name}\" (ID: {$category->id}) has no description.",
                            'Add a category description to improve SEO and help users understand the category.',
                            $counts
                        );
                    }
                }
            });
    }

    private function auditStores(array &$counts): void
    {
        Store::where('status', 'approved')
            ->chunkById(200, function ($stores) use (&$counts) {
                foreach ($stores as $store) {
                    $url = '/store/' . $store->slug;

                    if (empty($store->description)) {
                        $this->createAuditResult(
                            'store',
                            $store->id,
                            $url,
                            'missing_description',
                            'info',
                            "Store \"{$store->name}\" (ID: {$store->id}) has no description.",
                            'Add a store description to improve discoverability.',
                            $counts
                        );
                    }
                }
            });
    }

    private function getSitemapProducts(string $baseUrl): array
    {
        $urls = [];
        Product::published()
            ->select(['id', 'slug', 'updated_at'])
            ->chunkById(200, function ($products) use ($baseUrl, &$urls) {
                foreach ($products as $product) {
                    $urls[] = [
                        'loc'      => $baseUrl . '/products/' . $product->slug,
                        'lastmod'  => $product->updated_at?->toAtomString(),
                        'priority' => '0.8',
                        'changefreq' => 'weekly',
                    ];
                }
            });
        return $urls;
    }

    private function getSitemapCategories(string $baseUrl): array
    {
        $urls = [];
        Category::active()
            ->select(['id', 'slug', 'updated_at'])
            ->chunkById(200, function ($categories) use ($baseUrl, &$urls) {
                foreach ($categories as $category) {
                    $urls[] = [
                        'loc'      => $baseUrl . '/category/' . $category->slug,
                        'lastmod'  => $category->updated_at?->toAtomString(),
                        'priority' => '0.7',
                        'changefreq' => 'weekly',
                    ];
                }
            });
        return $urls;
    }

    private function getSitemapStores(string $baseUrl): array
    {
        $urls = [];
        Store::where('status', 'approved')
            ->select(['id', 'slug', 'updated_at'])
            ->chunkById(200, function ($stores) use ($baseUrl, &$urls) {
                foreach ($stores as $store) {
                    $urls[] = [
                        'loc'      => $baseUrl . '/store/' . $store->slug,
                        'lastmod'  => $store->updated_at?->toAtomString(),
                        'priority' => '0.6',
                        'changefreq' => 'monthly',
                    ];
                }
            });
        return $urls;
    }

    private function getSitemapPages(string $baseUrl): array
    {
        $urls = [];
        CmsPage::where('status', 'published')
            ->select(['id', 'slug', 'updated_at'])
            ->chunkById(200, function ($pages) use ($baseUrl, &$urls) {
                foreach ($pages as $page) {
                    $urls[] = [
                        'loc'      => $baseUrl . '/' . ltrim($page->slug, '/'),
                        'lastmod'  => $page->updated_at?->toAtomString(),
                        'priority' => '0.5',
                        'changefreq' => 'monthly',
                    ];
                }
            });
        return $urls;
    }
}
