<?php

namespace App\Modules\Shared\Presentation\Http\Filters;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\Request;

class ListingDateRange
{
    public static function apply(
        EloquentBuilder|QueryBuilder $query,
        Request $request,
        string $column,
        string $fromKey = 'date_from',
        string $toKey = 'date_to',
    ): void {
        $filters = $request->validate([
            $fromKey => ['nullable', 'date_format:Y-m-d'],
            $toKey => ['nullable', 'date_format:Y-m-d', 'after_or_equal:'.$fromKey],
        ]);
        $timezone = config('app.timezone', 'UTC');

        if (! empty($filters[$fromKey])) {
            $query->where(
                $column,
                '>=',
                CarbonImmutable::createFromFormat('!Y-m-d', $filters[$fromKey], $timezone)->startOfDay(),
            );
        }

        if (! empty($filters[$toKey])) {
            $query->where(
                $column,
                '<=',
                CarbonImmutable::createFromFormat('!Y-m-d', $filters[$toKey], $timezone)->endOfDay(),
            );
        }
    }
}
