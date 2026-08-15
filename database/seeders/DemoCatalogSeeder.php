<?php

namespace Database\Seeders;

use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $vendorUser = User::query()->firstOrCreate(
            ['email' => 'vendor@gosika.com.np'],
            [
                'uuid' => (string) Str::uuid(),
                'first_name' => 'Demo',
                'last_name' => 'Vendor',
                'phone' => '9800000003',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'status' => UserStatus::ACTIVE,
            ]
        );
        $vendorUser->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->firstOrCreate(
            ['user_id' => $vendorUser->id],
            [
                'company_name' => 'Koshi Handicrafts',
                'business_email' => 'hello@koshi.com.np',
                'status' => VendorStatus::APPROVED,
            ]
        );

        $store = Store::query()->firstOrCreate(
            ['vendor_id' => $vendor->id],
            [
                'name' => 'Koshi Handicrafts Store',
                'slug' => 'koshi-handicrafts-store-'.$vendor->id,
                'contact_email' => 'hello@koshi.com.np',
                'status' => StoreStatus::ACTIVE,
            ]
        );

        $handicrafts = Category::query()->where('slug', 'handicrafts')->first();
        $apparel = Category::query()->where('slug', 'apparel')->first();
        $nepaliArts = Brand::query()->where('slug', 'nepali-arts')->first();
        $everest = Brand::query()->where('slug', 'everest-textiles')->first();

        $products = [
            [
                'name' => 'Handwoven Dhaka Topi',
                'slug' => 'handwoven-dhaka-topi',
                'sku' => 'DHK-001',
                'price' => 850.00,
                'compare_at_price' => 1000.00,
                'quantity' => 25,
                'category_id' => $handicrafts?->id,
                'brand_id' => $nepaliArts?->id,
                'is_featured' => true,
                'weight_grams' => 80,
            ],
            [
                'name' => 'Pashmina Shawl',
                'slug' => 'pashmina-shawl',
                'sku' => 'PASH-001',
                'price' => 4500.00,
                'compare_at_price' => 5200.00,
                'quantity' => 12,
                'category_id' => $apparel?->id,
                'brand_id' => $everest?->id,
                'is_featured' => true,
                'weight_grams' => 220,
            ],
            [
                'name' => 'Koshi Organic Honey 500g',
                'slug' => 'koshi-organic-honey',
                'sku' => 'HON-500',
                'price' => 1200.00,
                'quantity' => 40,
                'category_id' => Category::query()->where('slug', 'food-beverages')->value('id'),
                'brand_id' => Brand::query()->where('slug', 'koshi-organic')->value('id'),
                'is_featured' => false,
                'weight_grams' => 550,
            ],
            [
                'name' => 'Himalayan Herbal Tea 100g',
                'slug' => 'himalayan-herbal-tea',
                'sku' => 'TEA-100',
                'price' => 450.00,
                'quantity' => 60,
                'category_id' => Category::query()->where('slug', 'beauty-care')->value('id'),
                'brand_id' => Brand::query()->where('slug', 'himalayan-herbals')->value('id'),
                'is_featured' => false,
                'weight_grams' => 120,
            ],
        ];

        foreach ($products as $data) {
            Product::query()->updateOrCreate(
                ['sku' => $data['sku']],
                array_merge($data, [
                    'vendor_id' => $vendor->id,
                    'store_id' => $store->id,
                    'status' => ProductStatus::PUBLISHED,
                    'stock_status' => 'in_stock',
                    'low_stock_threshold' => 5,
                    'description' => $data['name'].' — quality Nepali product available on GOSIKA.',
                    'short_description' => 'Authentic Nepali product.',
                ])
            );
        }
    }
}
