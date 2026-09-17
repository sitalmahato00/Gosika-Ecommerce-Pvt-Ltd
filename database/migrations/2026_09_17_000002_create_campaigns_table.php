<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('title', 200);
            $table->string('tagline', 300)->nullable();
            $table->text('description')->nullable();
            $table->string('image', 600)->nullable();
            $table->string('type', 30)->default('promo')->index(); // flash_sale | discount | bundle | free_shipping | special
            $table->string('target_type', 20)->default('all'); // all | store | category | product
            $table->json('target_ids')->nullable();
            $table->string('discount_type', 20)->nullable(); // percentage | fixed
            $table->decimal('discount_value', 12, 2)->nullable();
            $table->decimal('min_order_amount', 12, 2)->nullable();
            $table->string('status', 20)->default('draft')->index(); // draft | scheduled | active | paused | ended
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};