<?php

namespace App\Modules\Vendor\Application\Services;

use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\SellerTier;
use App\Modules\Vendor\Infrastructure\Models\Vendor;

class SellerTierService
{
    /** Fulfilled order statuses that count toward tier progression. */
    protected const EXCLUDED_STATUSES = [
        OrderStatus::CANCELLED->value,
        OrderStatus::FAILED->value,
        OrderStatus::REJECTED->value,
        OrderStatus::REFUNDED->value,
        OrderStatus::RETURNED->value,
    ];

    public function activeTiers(): array
    {
        return SellerTier::query()
            ->where('is_active', true)
            ->orderBy('badge_level')
            ->orderBy('sort_order')
            ->get()
            ->all();
    }

    public function tierFor(int $orders, float $gmv): ?SellerTier
    {
        foreach ($this->activeTiers() as $tier) {
            if ($orders >= (int) $tier->min_orders && $gmv >= (float) $tier->min_gmv) {
                return $tier;
            }
        }

        return null;
    }

    /** @return \Illuminate\Contracts\Pagination\LengthAwarePaginator */
    public function assignments(): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return Vendor::query()
            ->where('status', VendorStatus::APPROVED)
            ->with(['sellerTier'])
            ->withCount(['orders as order_count' => fn ($q) => $q->whereNotIn('status', self::EXCLUDED_STATUSES)])
            ->withSum(['orders as gmv' => fn ($q) => $q->whereNotIn('status', self::EXCLUDED_STATUSES)], 'grand_total')
            ->latest()
            ->paginate((int) request()->integer('per_page', 20));
    }
}