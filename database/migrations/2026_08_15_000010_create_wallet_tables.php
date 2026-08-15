<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_wallets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('balance', 12, 2)->default(0);
            $table->decimal('available_balance', 12, 2)->default(0);
            $table->decimal('pending_balance', 12, 2)->default(0);
            $table->string('currency', 3)->default('NPR');
            $table->unsignedBigInteger('version')->default(1)->comment('Optimistic locking');
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('wallet_id')->constrained('vendor_wallets')->cascadeOnDelete();
            $table->string('transaction_type', 30)->index();
            $table->string('reference_type', 60)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('balance_before', 12, 2)->default(0);
            $table->decimal('balance_after', 12, 2)->default(0);
            $table->string('status', 20)->default('completed');
            $table->text('description')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
            $table->index(['wallet_id', 'created_at']);
        });

        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->decimal('rate', 6, 2)->default(0);
            $table->decimal('basis_amount', 12, 2)->default(0);
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('status', 20)->default('calculated')->index();
            $table->timestamp('calculated_at')->nullable();
            $table->unsignedBigInteger('adjusted_by')->nullable();
            $table->timestamp('adjusted_at')->nullable();
            $table->string('adjustment_reason', 500)->nullable();
            $table->timestamp('reversed_at')->nullable();
            $table->timestamps();

            $table->unique('vendor_order_id');
        });

        Schema::create('settlements', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('settlement_number', 40)->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('gross_sales', 12, 2)->default(0);
            $table->decimal('commission_total', 12, 2)->default(0);
            $table->decimal('refunds_total', 12, 2)->default(0);
            $table->decimal('adjustments_total', 12, 2)->default(0);
            $table->decimal('net_payable', 12, 2)->default(0);
            $table->string('status', 20)->default('pending')->index();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['vendor_id', 'status']);
            $table->index(['period_start', 'period_end']);
        });

        Schema::create('payout_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('payout_number', 40)->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('settlement_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('wallet_id')->constrained('vendor_wallets')->cascadeOnDelete();
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('status', 20)->default('pending')->index();
            $table->timestamp('requested_at')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->string('rejection_reason', 500)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['vendor_id', 'status']);
        });

        Schema::create('payout_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payout_request_id')->constrained()->cascadeOnDelete();
            $table->string('provider_reference', 120)->nullable();
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('fee', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);
            $table->string('status', 20)->default('processing');
            $table->timestamp('paid_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_records');
        Schema::dropIfExists('payout_requests');
        Schema::dropIfExists('settlements');
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('vendor_wallets');
    }
};
