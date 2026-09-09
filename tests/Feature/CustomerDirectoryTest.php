<?php

namespace Tests\Feature;

use App\Modules\Customer\Infrastructure\Models\CustomerWallet;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Support\Infrastructure\Models\SupportTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerDirectoryTest extends TestCase
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

    public function test_customer_directory_lists_customers_with_aggregates(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(6, 'data')
            ->assertJsonStructure([
                'data' => [[
                    'id', 'name', 'email', 'phone', 'status', 'created_at',
                    'orders_count', 'total_spend', 'last_order_at', 'wallet_balance', 'addresses_count',
                ]],
                'meta' => ['pagination' => ['total', 'per_page', 'current_page', 'last_page']],
            ]);
    }

    public function test_customer_directory_supports_search_and_status_filters(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers?search=sunsari')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'sunsari.sharma@example.com');

        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers?status=suspended')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_customer_stats_are_accurate(): void
    {
        $orderCount = Order::query()->whereNotIn('status', ['cancelled', 'failed', 'refunded'])->count();
        $walletSum = (float) CustomerWallet::query()->sum('balance');

        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers/stats')
            ->assertOk()
            ->assertJsonPath('data.total_customers', 6)
            ->assertJsonPath('data.active_customers', 6)
            ->assertJsonPath('data.total_orders', $orderCount)
            ->assertJsonPath('data.wallet_balance', 11000)
            ->assertJsonPath('data.wallet_customers', 6);
    }

    public function test_customer_segments_expose_correct_counts(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers/segments')
            ->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonPath('data.all_customers.count', 6)
            ->assertJsonPath('data.active_buyers.count', 6)
            ->assertJsonPath('data.repeat_buyers.count', 6)
            ->assertJsonPath('data.high_value.count', 3)
            ->assertJsonPath('data.new_customers.count', 6);
    }

    public function test_segment_members_are_paginated(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers/segments/high_value')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 3);

        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers/segments/all_customers')
            ->assertOk()
            ->assertJsonPath('meta.pagination.total', 6)
            ->assertJsonPath('data.0.addresses_count', 2);

        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers/segments/unknown')
            ->assertStatus(404);
    }

    public function test_customer_wallets_list_and_detail(): void
    {
        $wallets = CustomerWallet::query()->with('user')->orderByDesc('balance')->get();
        $top = $wallets->first();
        $userUuid = $top->user->uuid;

        $this->withToken($this->token)
            ->getJson('/api/v1/admin/customers/wallets')
            ->assertOk()
            ->assertJsonCount(6, 'data')
            ->assertJsonPath('data.0.customer.email', $top->user->email)
            ->assertJsonPath('data.0.balance', 5000);

        $this->withToken($this->token)
            ->getJson("/api/v1/admin/customers/wallets/{$userUuid}")
            ->assertOk()
            ->assertJsonPath('data.wallet.customer.email', $top->user->email)
            ->assertJsonCount(count($top->transactions), 'data.transactions')
            ->assertJsonStructure(['data' => ['wallet' => ['id', 'balance', 'currency'], 'transactions' => [[
                'transaction_type', 'amount', 'balance_before', 'balance_after', 'description', 'created_at',
            ]]]]);
    }

    public function test_support_tickets_channel_customer_returns_only_customer_tickets(): void
    {
        $this->withToken($this->token)
            ->getJson('/api/v1/admin/support/tickets?channel=customer')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.pagination.total', 5);

        $this->withToken($this->token)
            ->getJson('/api/v1/admin/support/tickets?channel=vendor')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_support_ticket_reply_and_close_work(): void
    {
        $ticket = SupportTicket::query()->whereNull('vendor_id')->first();

        $this->withToken($this->token)
            ->postJson("/api/v1/admin/support/tickets/{$ticket->uuid}/messages", ['message' => 'Reply from support.'])
            ->assertCreated()
            ->assertJsonPath('success', true);

        $this->withToken($this->token)
            ->postJson("/api/v1/admin/support/tickets/{$ticket->uuid}/close")
            ->assertOk()
            ->assertJsonPath('data.status', 'closed');
    }
}