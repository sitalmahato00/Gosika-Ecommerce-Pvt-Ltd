<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_promotions', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->string('name', 250);
            $table->text('tagline')->nullable();
            $table->string('type', 30)->default('percentage')->comment('percentage|fixed|free_shipping|buy_one_get_one');
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->string('category', 120)->nullable();
            $table->string('banner_image', 600)->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->string('status', 20)->default('scheduled')->comment('draft|scheduled|active|ended');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['vendor_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_promotions');
    }
};
