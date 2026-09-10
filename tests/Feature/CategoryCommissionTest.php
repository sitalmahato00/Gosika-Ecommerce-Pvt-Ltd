<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Category;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Wallet\Infrastructure\Models\CategoryCommissionRule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryCommissionTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
        $admin = User::where('email', 'admin@gosika.com.np')->firstOrFail();
        $this->token = $admin->createToken('test')->plainTextToken;
    }

    public function test_index_returns_category_tree_with_effective_rates(): void
    {
        $handicrafts = Category::where('name', 'Handicrafts')->firstOrFail();

        $this->withToken($this->token)
            ->getJson('/api/v1/admin/commissions')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.defaults.default_rate', 10)
            ->assertJsonStructure([
                'data' => [[
                    'id', 'name', 'commission_rate', 'effective_rate', 'children',
                ]],
            ])
            ->assertJsonFragment([
                'name' => 'Handicrafts',
                'commission_rate' => '5.00',
                'effective_rate' => '5.00',
            ]);

        $this->assertDatabaseHas('category_commission_rules', [
            'category_id' => $handicrafts->id,
            'commission_rate' => 5,
        ]);
    }

    public function test_update_rate_creates_or_overrides_category_rule(): void
    {
        $category = Category::where('name', 'Gift & Seasonal')->first()
            ?? Category::where('name', 'Handicrafts')->firstOrFail();

        $this->withToken($this->token)
            ->putJson("/api/v1/admin/commissions/categories/{$category->uuid}", [
                'commission_rate' => 8.5,
            ])
            ->assertOk()
            ->assertJsonPath('data.commission_rate', 8.5);

        $this->assertDatabaseHas('category_commission_rules', [
            'category_id' => $category->id,
            'commission_rate' => 8.5,
        ]);
    }

    public function test_reset_rate_removes_category_rule(): void
    {
        $category = Category::where('name', 'Handicrafts')->firstOrFail();
        $count = CategoryCommissionRule::where('category_id', $category->id)->count();
        $this->assertGreaterThan(0, $count);

        $this->withToken($this->token)
            ->deleteJson("/api/v1/admin/commissions/categories/{$category->uuid}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Handicrafts');

        $this->assertDatabaseMissing('category_commission_rules', [
            'category_id' => $category->id,
        ]);
    }
}