<?php

namespace Database\Seeders;

use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Handicrafts', 'slug' => 'handicrafts', 'description' => 'Handmade Nepali crafts.', 'icon' => '🎨', 'tax_rate' => 13],
            ['name' => 'Food & Beverages', 'slug' => 'food-beverages', 'description' => 'Local food products.', 'icon' => '🍯', 'tax_rate' => 5],
            ['name' => 'Apparel', 'slug' => 'apparel', 'description' => 'Clothing and textiles.', 'icon' => '🧣', 'tax_rate' => 13],
            ['name' => 'Home & Living', 'slug' => 'home-living', 'description' => 'Home decor and furniture.', 'icon' => '🏠', 'tax_rate' => 13],
            ['name' => 'Beauty & Care', 'slug' => 'beauty-care', 'description' => 'Herbal and organic products.', 'icon' => '🌿', 'tax_rate' => 13],
        ];

        foreach ($categories as $index => $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                [
                    'uuid' => (string) Str::uuid(),
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'icon' => $category['icon'],
                    'status' => 'active',
                    'tax_rate' => $category['tax_rate'],
                    'sort_order' => $index + 1,
                ]
            );
        }

        $brands = [
            ['name' => 'Nepali Arts', 'slug' => 'nepali-arts', 'description' => 'Artisan craft collective.'],
            ['name' => 'Himalayan Herbals', 'slug' => 'himalayan-herbals', 'description' => 'Herbal health products.'],
            ['name' => 'Koshi Organic', 'slug' => 'koshi-organic', 'description' => 'Organic food from Koshi province.'],
            ['name' => 'Everest Textiles', 'slug' => 'everest-textiles', 'description' => 'Quality Nepali textiles.'],
        ];

        foreach ($brands as $brand) {
            Brand::query()->updateOrCreate(
                ['slug' => $brand['slug']],
                [
                    'uuid' => (string) Str::uuid(),
                    'name' => $brand['name'],
                    'description' => $brand['description'],
                    'status' => 'active',
                ]
            );
        }

        DB::table('activity_logs')->insertOrIgnore([
            'uuid' => (string) Str::uuid(),
            'user_id' => null,
            'activity_type' => 'catalog.seeded',
            'description' => 'Seeded '.count($categories).' categories and '.count($brands).' brands.',
            'properties' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
