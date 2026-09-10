<?php

namespace App\Modules\Wallet\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Platform\Infrastructure\Models\Setting;
use App\Modules\Shared\Presentation\Http\Response;
use App\Modules\Wallet\Application\Services\CategoryCommissionResolver;
use App\Modules\Wallet\Infrastructure\Models\CategoryCommissionRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminCommissionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::WALLETS_VIEW);
    }

    public function index(Request $request): JsonResponse
    {
        $default = (float) Setting::get('commission.default_rate', 10);
        $resolver = app(CategoryCommissionResolver::class);

        $categories = Category::query()
            ->whereNull('parent_id')
            ->active()
            ->orderBy('sort_order')
            ->get();

        $data = $categories->map(fn (Category $category) => $this->treeNode($category, $resolver));

        return Response::success(
            $data->values(),
            'Commission rules retrieved.',
            [
                'defaults' => [
                    'default_rate' => $default,
                ],
                'pagination' => [
                    'total' => $data->count(),
                    'per_page' => $data->count(),
                    'current_page' => 1,
                    'last_page' => 1,
                ],
            ]
        );
    }

    public function updateRate(Request $request, string $categoryId): JsonResponse
    {
        $data = $request->validate([
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $category = Category::where('uuid', $categoryId)->firstOrFail();
        $rate = (float) $data['commission_rate'];

        CategoryCommissionRule::updateOrCreate(
            ['category_id' => $category->id],
            [
                'commission_rate' => $rate,
                'updated_by' => $request->user()?->id,
            ]
        );

        app(AuditLogService::class)->record(
            $request->user(),
            'commission.rate_updated',
            'category',
            $category->uuid,
            [],
            ['category' => $category->name, 'commission_rate' => $rate]
        );

        return Response::success([
            'id' => $category->uuid,
            'name' => $category->name,
            'commission_rate' => $rate,
        ], 'Commission rate updated.');
    }

    public function resetRate(string $categoryId): JsonResponse
    {
        $category = Category::where('uuid', $categoryId)->firstOrFail();

        CategoryCommissionRule::query()->where('category_id', $category->id)->delete();

        return Response::success([
            'id' => $category->uuid,
            'name' => $category->name,
        ], 'Commission rate reset to default.');
    }

    protected function treeNode(Category $category, CategoryCommissionResolver $resolver): array
    {
        $explicit = $category->commissionRule?->commission_rate;
        $effective = $resolver->rateForOr($category, (float) Setting::get('commission.default_rate', 10));

        return [
            'id' => $category->uuid,
            'parent_id' => $category->parent_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'status' => $category->status,
            'tax_rate' => $category->tax_rate,
            'commission_rate' => $explicit !== null ? number_format((float) $explicit, 2, '.', '') : null,
            'effective_rate' => number_format($effective, 2, '.', ''),
            'children' => $category->children()
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Category $child) => $this->treeNode($child, $resolver))
                ->values(),
        ];
    }
}