<?php

namespace Database\Seeders;

use App\Modules\Catalog\Infrastructure\Models\Brand;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Catalog\Infrastructure\Models\ProductImage;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $vendor = Vendor::query()->first();

        if (! $vendor) {
            $this->command?->warn('No vendor found. ProductSeeder skipped.');

            return;
        }

        $store = Store::query()->where('vendor_id', $vendor->id)->first();

        if (! $store) {
            $store = Store::query()->create([
                'vendor_id' => $vendor->id,
                'name' => 'Himalayan Handicrafts',
                'slug' => 'himalayan-handicrafts',
                'contact_email' => 'vendor@gosika.com.np',
                'status' => StoreStatus::ACTIVE,
            ]);
        } else {
            $store->update([
                'name' => 'Himalayan Handicrafts',
                'slug' => 'himalayan-handicrafts',
                'contact_email' => 'vendor@gosika.com.np',
                'status' => StoreStatus::ACTIVE,
            ]);
        }

        $products = [
            [
                'name' => 'Hand-Knotted Thangka Painting',
                'category' => 'Handicrafts',
                'brand' => 'Nepali Arts',
                'price' => 4500,
                'compare_at_price' => 5500,
                'quantity' => 15,
                'is_featured' => true,
                'short_description' => 'Traditional hand-painted Buddhist thangka on canvas.',
                'description' => 'A beautifully detailed hand-knotted thangka painting made by master artisans of the Kathmandu valley. Rendered with natural mineral pigments on cotton canvas, this artwork brings peace and heritage to any space.',
                'images' => [
                    'https://images.unsplash.com/photo-1545016696-f44b8b9f9a6e?w=800&q=80',
                    'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&q=80',
                ],
            ],
            [
                'name' => 'Brass Singing Bowl Set',
                'category' => 'Handicrafts',
                'brand' => 'Nepali Arts',
                'price' => 3200,
                'compare_at_price' => 3900,
                'quantity' => 25,
                'is_featured' => false,
                'short_description' => 'Hand-hammered brass singing bowl with cushion and striker.',
                'description' => 'Hand-hammered seven-metal singing bowl from the Patan metalworking tradition. Includes a silk cushion and wooden striker for meditation and sound therapy.',
                'images' => [
                    'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800&q=80',
                    'https://images.unsplash.com/photo-1519821172144-4f87d85de2a7?w=800&q=80',
                ],
            ],
            [
                'name' => 'Himalayan Wild Honey (500g)',
                'category' => 'Food & Beverages',
                'brand' => 'Koshi Organic',
                'price' => 1250,
                'compare_at_price' => 1500,
                'quantity' => 40,
                'is_featured' => true,
                'short_description' => 'Raw wild honey harvested from the Koshi hills.',
                'description' => 'Pure, unfiltered wild honey gathered from high-altitude cliffs of eastern Nepal. Naturally sweet with a rich amber color and no additives.',
                'images' => [
                    'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&q=80',
                    'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80',
                ],
            ],
            [
                'name' => 'Organic Ginger Tea (200g)',
                'category' => 'Food & Beverages',
                'brand' => 'Koshi Organic',
                'price' => 850,
                'compare_at_price' => 950,
                'quantity' => 60,
                'is_featured' => false,
                'short_description' => 'Refreshing organic ginger tea blend from Ilam.',
                'description' => 'A warming blend of sun-dried organic ginger and highland tea leaves from Ilam. Perfect for a comforting cup any time of the day.',
                'images' => [
                    'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80',
                    'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
                ],
            ],
            [
                'name' => 'Dhaka Print Cotton Kurta',
                'category' => 'Apparel',
                'brand' => 'Everest Textiles',
                'price' => 2400,
                'compare_at_price' => 2999,
                'quantity' => 30,
                'is_featured' => true,
                'short_description' => 'Handwoven cotton kurta with traditional dhaka pattern.',
                'description' => 'Comfortable handwoven cotton kurta featuring the iconic Nepali dhaka pattern. Breathable fabric, tailored fit, and available in multiple sizes.',
                'images' => [
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
                    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
                ],
            ],
            [
                'name' => 'Handwoven Wool Scarf',
                'category' => 'Apparel',
                'brand' => 'Everest Textiles',
                'price' => 1800,
                'compare_at_price' => null,
                'quantity' => 35,
                'is_featured' => false,
                'short_description' => 'Soft Himalayan wool scarf in earthy tones.',
                'description' => 'Woven from soft Himalayan sheep wool, this scarf keeps you warm while showcasing traditional patterns. A stylish companion for winter.',
                'images' => [
                    'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80',
                    'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80',
                ],
            ],
            [
                'name' => 'Carved Wooden Candle Holder',
                'category' => 'Home & Living',
                'brand' => 'Nepali Arts',
                'price' => 1400,
                'compare_at_price' => 1700,
                'quantity' => 20,
                'is_featured' => false,
                'short_description' => 'Hand-carved mango wood tealight holder.',
                'description' => 'Intricately carved mango wood candle holder, finished with natural oils. Creates a warm, ambient glow for your living space.',
                'images' => [
                    'https://images.unsplash.com/photo-1602874801006-2b3bafb4e3e8?w=800&q=80',
                    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80',
                ],
            ],
            [
                'name' => 'Hemp Jute Storage Basket',
                'category' => 'Home & Living',
                'brand' => 'Everest Textiles',
                'price' => 1600,
                'compare_at_price' => null,
                'quantity' => 18,
                'is_featured' => true,
                'short_description' => 'Durable hand-woven jute basket for storage.',
                'description' => 'Eco-friendly hand-woven jute basket ideal for storing blankets, toys, or laundry. Sturdy, stylish, and made from sustainable fibres.',
                'images' => [
                    'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&q=80',
                    'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=800&q=80',
                ],
            ],
            [
                'name' => 'Wild Flower Body Butter',
                'category' => 'Beauty & Care',
                'brand' => 'Himalayan Herbals',
                'price' => 1100,
                'compare_at_price' => 1300,
                'quantity' => 45,
                'is_featured' => false,
                'short_description' => 'Nourishing body butter with wild Himalayan flowers.',
                'description' => 'Deeply nourishing body butter whipped with wild flower extracts, shea butter, and cold-pressed mountain oils. Leaves skin soft and fragrant.',
                'images' => [
                    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80',
                    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
                ],
            ],
            [
                'name' => 'Neem & Tulsi Face Wash',
                'category' => 'Beauty & Care',
                'brand' => 'Himalayan Herbals',
                'price' => 650,
                'compare_at_price' => null,
                'quantity' => 55,
                'is_featured' => true,
                'short_description' => 'Gentle daily face wash with neem and tulsi.',
                'description' => 'A gentle, soap-free face wash formulated with neem and holy basil to cleanse, refresh, and calm the skin without drying it out.',
                'images' => [
                    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
                    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
                ],
            ],
        ];

        foreach ($products as $data) {
            $category = Category::query()->where('slug', Str::slug($data['category']))->first();
            $brand = Brand::query()->where('slug', Str::slug($data['brand']))->first();
            $slug = Str::slug($data['name']);

            $product = Product::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'uuid' => (string) Str::uuid(),
                    'vendor_id' => $vendor->id,
                    'store_id' => $store->id,
                    'category_id' => $category?->id,
                    'brand_id' => $brand?->id,
                    'name' => $data['name'],
                    'description' => $data['description'],
                    'short_description' => $data['short_description'],
                    'sku' => 'GSK-'.strtoupper(Str::random(6)),
                    'barcode' => (string) Str::uuid(),
                    'status' => ProductStatus::PUBLISHED,
                    'stock_status' => 'in_stock',
                    'quantity' => $data['quantity'],
                    'low_stock_threshold' => 5,
                    'price' => $data['price'],
                    'compare_at_price' => $data['compare_at_price'],
                    'currency' => 'NPR',
                    'weight_grams' => 500,
                    'tax_rate' => 13,
                    'is_featured' => $data['is_featured'],
                    'is_variant' => false,
                ]
            );

            ProductImage::query()->where('product_id', $product->id)->delete();

            foreach (array_values($data['images']) as $index => $url) {
                ProductImage::query()->create([
                    'uuid' => (string) Str::uuid(),
                    'product_id' => $product->id,
                    'file_path' => $url,
                    'sort_order' => $index,
                    'is_primary' => $index === 0,
                ]);
            }
        }

        $this->command?->info('Seeded '.count($products).' demo products for '.$store->name.'.');
    }
}
