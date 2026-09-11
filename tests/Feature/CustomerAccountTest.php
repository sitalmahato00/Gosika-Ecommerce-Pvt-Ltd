<?php

namespace Tests\Feature;

use App\Modules\Catalog\Infrastructure\Models\Product;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Marketplace\Infrastructure\Models\ProductQuestion;
use App\Modules\Marketplace\Infrastructure\Models\ProductReview;
use App\Modules\Order\Infrastructure\Models\Order;
use App\Modules\Order\Infrastructure\Models\OrderItem;
use App\Modules\Order\Infrastructure\Models\VendorOrder;
use App\Modules\Shared\Domain\Enums\OrderStatus;
use App\Modules\Shared\Domain\Enums\ProductStatus;
use App\Modules\Shared\Domain\Enums\ReviewStatus;
use App\Modules\Shared\Domain\Enums\StoreStatus;
use App\Modules\Shared\Domain\Enums\VendorStatus;
use App\Modules\Vendor\Infrastructure\Models\Store;
use App\Modules\Vendor\Infrastructure\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerAccountTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RolePermissionSeeder::class);
    }

    protected function customer(): User
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::CUSTOMER);

        return $user;
    }

    protected function activeStore(): array
    {
        $user = User::factory()->create();
        $user->assignRole(Roles::VENDOR_ADMIN);

        $vendor = Vendor::query()->create([
            'user_id' => $user->id,
            'company_name' => 'Account Vendor',
            'business_email' => 'account@vendor.com.np',
            'status' => VendorStatus::APPROVED,
        ]);

        $store = Store::query()->create([
            'vendor_id' => $vendor->id,
            'name' => 'Account Store',
            'slug' => 'account-store-'.$vendor->id,
            'contact_email' => 'account@vendor.com.np',
            'status' => StoreStatus::ACTIVE,
        ]);

        $product = Product::query()->create([
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'name' => 'Account Product',
            'slug' => 'account-product-'.$vendor->id,
            'sku' => 'ACCT-'.$vendor->id,
            'status' => ProductStatus::PUBLISHED,
            'stock_status' => 'in_stock',
            'quantity' => 10,
            'low_stock_threshold' => 2,
            'price' => 500.00,
            'tax_rate' => 0,
        ]);

        return [$vendor, $store, $product];
    }

    protected function deliveredOrderFor(User $user, Product $product): OrderItem
    {
        [$vendor, $store] = [$product->vendor, $product->store];

        $order = Order::query()->create([
            'user_id' => $user->id,
            'order_number' => 'ORD-ACCT-'.$product->id,
            'payment_method' => 'cod',
            'payment_status' => 'paid',
            'status' => OrderStatus::DELIVERED,
            'subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'currency' => 'NPR',
            'placed_at' => now(),
            'completed_at' => now(),
        ]);

        $vendorOrder = VendorOrder::query()->create([
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'store_id' => $store->id,
            'vendor_order_number' => 'VO-ACCT-'.$order->id,
            'status' => OrderStatus::COMPLETED,
            'delivery_status' => 'delivered',
            'items_subtotal' => $product->price,
            'discount' => 0,
            'delivery_charge' => 80,
            'tax' => 0,
            'grand_total' => $product->price + 80,
            'commission_rate' => 10,
            'commission_amount' => 0,
            'vendor_payable' => 0,
        ]);

        return OrderItem::query()->create([
            'order_id' => $order->id,
            'vendor_order_id' => $vendorOrder->id,
            'vendor_id' => $vendor->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => 2,
            'unit_price' => $product->price,
            'line_total' => $product->price * 2,
        ]);
    }

    public function test_guests_are_rejected_from_customer_account_endpoints(): void
    {
        $this->getJson('/api/v1/customer/stores')->assertUnauthorized();
        $this->getJson('/api/v1/customer/reviews')->assertUnauthorized();
        $this->getJson('/api/v1/customer/reviews/pending')->assertUnauthorized();
        $this->getJson('/api/v1/customer/questions')->assertUnauthorized();
    }

    public function test_pending_reviews_lists_eligible_items_without_review(): void
    {
        $user = $this->customer();
        [, , $product] = $this->activeStore();
        $this->deliveredOrderFor($user, $product);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/customer/reviews/pending');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.product_name', 'Account Product')
            ->assertJsonPath('data.0.quantity', 2);
    }

    public function test_reviewed_item_is_excluded_from_pending_reviews(): void
    {
        $user = $this->customer();
        [, , $product] = $this->activeStore();
        $item = $this->deliveredOrderFor($user, $product);

        ProductReview::query()->create([
            'user_id' => $user->id,
            'product_id' => $product->id,
            'vendor_order_item_id' => $item->id,
            'rating' => 5,
            'title' => 'Loved it',
            'body' => 'Great quality product.',
            'status' => ReviewStatus::APPROVED,
        ]);

$this->actingAs($user, 'sanctum')->getJson('/api/v1/customer/reviews/pending')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/customer/reviews')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.product_name', 'Account Product')
            ->assertJsonPath('data.0.rating', 5)
            ->assertJsonPath('data.0.status', 'approved');
    }

    public function test_my_questions_lists_only_own_questions(): void
    {
        $user = $this->customer();
        $other = $this->customer();
        [, , $product] = $this->activeStore();

        ProductQuestion::query()->create([
            'product_id' => $product->id,
            'user_id' => $user->id,
            'question' => 'Is this available in red?',
            'status' => ReviewStatus::APPROVED,
            'answer' => 'Yes it is.',
        ]);

        ProductQuestion::query()->create([
            'product_id' => $product->id,
            'user_id' => $other->id,
            'question' => 'Other user question',
            'status' => ReviewStatus::PENDING,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/customer/questions');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.question', 'Is this available in red?')
            ->assertJsonPath('data.0.product.name', 'Account Product')
            ->assertJsonPath('data.0.answer', 'Yes it is.');
    }

    public function test_my_stores_lists_stores_from_eligible_orders(): void
    {
        $user = $this->customer();
        [, $store, $product] = $this->activeStore();
        $this->deliveredOrderFor($user, $product);

$response = $this->actingAs($user, 'sanctum')->getJson('/api/v1/customer/stores');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Account Store')
            ->assertJsonPath('data.0.products_count', 1);
    }
}
