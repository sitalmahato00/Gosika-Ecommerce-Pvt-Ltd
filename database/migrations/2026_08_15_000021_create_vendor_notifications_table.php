<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 60)->default('general')->comment('new_order|settlement|review|low_stock|support|kyc|marketing|general');
            $table->string('title', 250);
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();

            $table->index(['vendor_id', 'read_at']);
        });

        Schema::create('customer_notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 60)->default('general')->comment('order|delivery|payment|return|support|promo|general');
            $table->string('title', 250);
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });

        Schema::create('admin_notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 60)->default('general')->comment('vendor|payout|settlement|return|delivery|refund|general');
            $table->string('title', 250);
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });

        Schema::create('delivery_notifications', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('delivery_partner_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type', 60)->default('general')->comment('assignment|delivery|payment|support|general');
            $table->string('title', 250);
            $table->text('body')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->unsignedBigInteger('updated_by')->nullable()->index();
            $table->timestamps();

            $table->index(['delivery_partner_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_notifications');
        Schema::dropIfExists('admin_notifications');
        Schema::dropIfExists('customer_notifications');
        Schema::dropIfExists('vendor_notifications');
    }
};