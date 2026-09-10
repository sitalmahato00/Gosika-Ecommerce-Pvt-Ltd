<?php

namespace App\Modules\Wallet\Application\Services;

use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Wallet\Infrastructure\Models\CategoryCommissionRule;
use Illuminate\Support\Collection;

class CategoryCommissionResolver
{
    protected Collection $rules;
    protected Collection $categories;

    public function __construct()
    {
        $this->rules = CategoryCommissionRule::query()->pluck('commission_rate', 'category_id');
        $this->categories = Category::query()->get()->keyBy('id');
    }

    /**
     * Resolve the nearest explicit commission rule for a category, walking
     * up the parent chain (subcategory -> category -> …) until a rule is found.
     */
    public function rateFor(?Category $category): ?float
    {
        if (! $category) {
            return null;
        }

        $cursor = $category;

        while ($cursor) {
            $rate = $this->rules->get($cursor->id);

            if ($rate !== null) {
                return (float) $rate;
            }

            $cursor = $this->categories->get($cursor->parent_id);
        }

        return null;
    }

    public function rateForOr(?Category $category, float $default): float
    {
        return $this->rateFor($category) ?? $default;
    }

    /**
     * Effective commission rate for a vendor order, blended across the line
     * items by net line value using each item's category/subcategory rule.
     */
    public function blendedRate(Collection $items, float $default): float
    {
        $total = 0.0;
        $weighted = 0.0;

        foreach ($items as $item) {
            $itemTotal = (float) ($item->total_price ?? 0);

            if ($itemTotal <= 0) {
                continue;
            }

            $rate = $this->rateForOr($item->product?->category, $default);
            $total += $itemTotal;
            $weighted += $itemTotal * $rate;
        }

        return $total > 0 ? round($weighted / $total, 2) : $default;
    }
}