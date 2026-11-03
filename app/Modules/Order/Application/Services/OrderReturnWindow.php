<?php

namespace App\Modules\Order\Application\Services;

use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Platform\Infrastructure\Models\Setting;
use Carbon\Carbon;

class OrderReturnWindow
{
    public static function deliveredAt(Order $order): ?Carbon
    {
        if ($order->completed_at) {
            return $order->completed_at;
        }

        $vendorOrders = $order->relationLoaded('vendorOrders')
            ? $order->vendorOrders
            : $order->vendorOrders()->with('assignments')->get();

        $deliveredAt = $vendorOrders
            ->flatMap(fn ($vendorOrder) => $vendorOrder->relationLoaded('assignments')
                ? $vendorOrder->assignments->pluck('delivered_at')
                : $vendorOrder->assignments()->whereNotNull('delivered_at')->pluck('delivered_at'))
            ->filter()
            ->map(fn ($date) => Carbon::parse($date))
            ->reduce(fn (?Carbon $latest, Carbon $date) => ! $latest || $date->greaterThan($latest) ? $date : $latest);

        return $deliveredAt;
    }

    public static function expiresAt(Order $order): ?Carbon
    {
        $deliveredAt = self::deliveredAt($order);
        if (! $deliveredAt) {
            return null;
        }

        $windowDays = max(1, (int) Setting::get('return.window_days', 7));

        return $deliveredAt->copy()->addDays($windowDays);
    }
}
