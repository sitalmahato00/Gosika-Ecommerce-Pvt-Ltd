<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('payment_number', 40)->unique();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('currency', 3)->default('NPR');
            $table->string('method', 20)->index();
            $table->string('provider', 20)->index();
            $table->string('status', 25)->default('initiated')->index();
            $table->string('provider_pidx', 100)->nullable()->unique();
            $table->string('provider_transaction_id', 120)->nullable()->index();
            $table->string('provider_refund_id', 120)->nullable();
            $table->string('payer_name', 180)->nullable();
            $table->string('payer_email')->nullable();
            $table->string('payer_phone', 20)->nullable();
            $table->json('provider_request')->nullable();
            $table->json('provider_response')->nullable();
            $table->timestamp('initiated_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['order_id', 'status']);
            $table->index(['created_at']);
        });

        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('attempt_number')->default(1);
            $table->string('status', 25)->default('initiated');
            $table->string('provider_pidx', 100)->nullable();
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('initiated_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::create('payment_status_history', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 25)->nullable();
            $table->string('to_status', 25);
            $table->string('reason', 500)->nullable();
            $table->unsignedBigInteger('actor_user_id')->nullable();
            $table->json('meta')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->index(['payment_id', 'created_at']);
        });

        Schema::create('refunds', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('refund_number', 40)->unique();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('return_request_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('reason', 500)->nullable();
            $table->string('status', 25)->default('requested')->index();
            $table->string('provider_refund_id', 120)->nullable();
            $table->json('provider_response')->nullable();
            $table->unsignedBigInteger('initiated_by')->nullable();
            $table->timestamp('initiated_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::create('reconciliation_records', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->date('reconciliation_date')->index();
            $table->string('provider', 20)->index();
            $table->string('provider_transaction_id', 120)->nullable();
            $table->unsignedBigInteger('payment_id')->nullable();
            $table->decimal('provider_amount', 12, 2)->default(0);
            $table->decimal('gosika_amount', 12, 2)->default(0);
            $table->string('status', 20)->default('pending')->index();
            $table->text('discrepancy_notes')->nullable();
            $table->json('meta')->nullable();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reconciliation_records');
        Schema::dropIfExists('refunds');
        Schema::dropIfExists('payment_status_history');
        Schema::dropIfExists('payment_attempts');
        Schema::dropIfExists('payments');
    }
};
