<?php

namespace App\Modules\Seo\Providers;

use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Seo\Application\Services\SeoService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class SeoServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SeoService::class, fn () => new SeoService());
    }

    public function boot(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/../Routes/api.php');

        $this->seedDefaultSettings();
    }

    private function seedDefaultSettings(): void
    {
        try {
            $defaults = [
                'seo.default_title_separator' => [' | ',                'string'],
                'seo.title_prefix'            => ['',                   'string'],
                'seo.title_suffix'            => [' | GOSIKA',          'string'],
                'seo.default_title_suffix'    => [' | GOSIKA',          'string'],
                'seo.default_robots'          => ['index,follow',       'string'],
                'seo.twitter_card'            => ['summary_large_image','string'],
                'seo.product_title_template'  => ['{product_name} - Buy Online{title_suffix}', 'string'],
                'seo.category_title_template' => ['Buy {category_name} Online{title_suffix}',  'string'],
                'seo.store_title_template'    => ['Shop at {store_name}{title_suffix}',         'string'],
                'seo.robots_txt'              => [
                    "User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /vendor/\nDisallow: /api/\nSitemap: {app_url}/api/v1/seo/sitemap.xml",
                    'string',
                ],
            ];

            foreach ($defaults as $key => [$value, $type]) {
                if (! Setting::where('key', $key)->exists()) {
                    Setting::set($key, $value, 'seo', $type, false, false);
                }
            }
        } catch (\Throwable) {
            // Table may not exist yet (during migrations / test bootstrap). Safe to skip.
        }
    }
}
