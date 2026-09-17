<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('gender', 15)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('default_shipping_address_id')->nullable();
            $table->string('default_billing_address_id')->nullable();
            $table->json('preferences')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('address_type', 20)->default('shipping')->comment('shipping|billing');
            $table->string('label', 60)->nullable();
            $table->string('full_name', 180)->nullable();
            $table->string('phone', 20);
            $table->string('address_line_1', 255);
            $table->string('address_line_2', 255)->nullable();
            $table->foreignId('country_id')->nullable()->constrained();
            $table->foreignId('province_id')->nullable()->constrained();
            $table->foreignId('district_id')->nullable()->constrained();
            $table->foreignId('municipality_id')->nullable()->constrained();
            $table->string('postal_code', 20)->nullable();
            $table->string('landmark', 255)->nullable();
            $table->string('latitude', 20)->nullable();
            $table->string('longitude', 20)->nullable();
            $table->boolean('is_default')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'address_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
        Schema::dropIfExists('customer_profiles');
    }
};
