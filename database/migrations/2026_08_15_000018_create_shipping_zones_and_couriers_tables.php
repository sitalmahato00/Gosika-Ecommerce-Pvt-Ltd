<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_zones', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('name', 180);
            $table->text('description')->nullable();
            $table->json('provinces')->nullable()->comment('Nepal province names covered by this zone');
            $table->decimal('standard_charge', 12, 2)->default(0);
            $table->decimal('express_charge', 12, 2)->default(0);
            $table->unsignedTinyInteger('estimated_days')->default(2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active']);
        });

        Schema::create('couriers', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('name', 180);
            $table->string('code', 60)->unique()->nullable();
            $table->string('logo', 500)->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->string('contact_email')->nullable();
            $table->string('tracking_url_pattern', 500)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('couriers');
        Schema::dropIfExists('shipping_zones');
    }
};
