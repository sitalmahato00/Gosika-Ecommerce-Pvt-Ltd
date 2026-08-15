<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('order_number', 40)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('checkout_session_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('shipping_address_id')->nullable()->constrained('customer_addresses')->nullOnDelete();
            $table->string('shipping_address_snapshot', 1000)->nullable();
            $table->string('payment_method', 20)->nullable();
            $table->string('payment_status', 25)->default('pending')->index();
            $table->string('status', 25)->default('pending')->index();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('delivery_charge', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->string('currency', 3)->default('NPR');
            $table->string('coupon_code', 60)->nullable();
            $table->text('customer_notes')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('placed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancelled_reason')->nullable();
            $table->unsignedBigInteger('cancelled_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status', 'created_at']);
        });

        Schema::create('vendor_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('vendor_order_number', 40)->unique();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('status', 25)->default('pending')->index();
            $table->string('delivery_status', 25)->default('pending')->index();
            $table->decimal('items_subtotal', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('delivery_charge', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->decimal('commission_rate', 6, 2)->nullable()->comment('Percent rate frozen at order time');
            $table->decimal('commission_amount', 12, 2)->default(0);
            $table->decimal('vendor_payable', 12, 2)->default(0);
            $table->string('delivery_partner_name', 180)->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['vendor_id', 'status']);
            $table->index(['order_id']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('product_name', 200);
            $table->string('sku', 80)->nullable();
            $table->string('variant_name', 200)->nullable();
            $table->string('image')->nullable();
            $table->unsignedBigInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('unit_discount', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->string('delivery_status', 25)->default('pending')->index();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['order_id']);
            $table->index(['vendor_order_id']);
            $table->index(['product_id']);
        });

        Schema::create('order_status_history', function (Blueprint $table) {
            $table->id();
            $table->morphs('trackable');
            $table->string('from_status', 25)->nullable();
            $table->string('to_status', 25);
            $table->string('reason', 500)->nullable();
            $table->unsignedBigInteger('actor_user_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['trackable_type', 'trackable_id', 'created_at'], 'osh_trackable_idx');
        });

        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('return_number', 40)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('reason_type', 60);
            $table->text('reason', 1000)->nullable();
            $table->unsignedBigInteger('quantity')->default(1);
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->string('status', 25)->default('requested')->index();
            $table->text('review_notes')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamp('window_expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['vendor_order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_requests');
        Schema::dropIfExists('order_status_history');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('vendor_orders');
        Schema::dropIfExists('orders');
    }
};
