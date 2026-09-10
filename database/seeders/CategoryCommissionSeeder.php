<?php

namespace Database\Seeders;

use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Wallet\Infrastructure\Models\CategoryCommissionRule;
use Illuminate\Database\Seeder;

class CategoryCommissionSeeder extends Seeder
{
    public function run(): void
    {
        $rules = [
            'Handicrafts' => 5,
            'Food & Beverages' => 3,
            'Apparel' => 6,
            'Home & Living' => 4,
            'Beauty & Care' => 7,
        ];

        foreach ($rules as $name => $rate) {
            $category = Category::query()->where('name', $name)->first();

            if (! $category) {
                continue;
            }

            CategoryCommissionRule::updateOrCreate(
                ['category_id' => $category->id],
                ['commission_rate' => $rate]
            );
        }
    }
}