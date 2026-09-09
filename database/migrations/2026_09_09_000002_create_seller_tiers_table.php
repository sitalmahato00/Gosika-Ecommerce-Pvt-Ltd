<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('seller_tiers', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->unsignedSmallInteger('badge_level')->default(0);
            $table->unsignedBigInteger('min_orders')->default(0);
            $table->decimal('min_gmv', 14, 2)->default(0);
            $table->decimal('commission_percent', 5, 2)->nullable()->comment('Overrides vendor commission when set');
            $table->string('badge_color', 40)->nullable();
            $table->string('badge_icon', 40)->nullable();
            $table->string('description', 500)->nullable();
            $table->json('benefits')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'badge_level']);
        });

        Schema::table('vendors', function (Blueprint $table) {
            if (! Schema::hasColumn('vendors', 'seller_tier_id')) {
                $table->foreignId('seller_tier_id')->nullable()->after('commission_rate')->constrained('seller_tiers')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            if (Schema::hasColumn('vendors', 'seller_tier_id')) {
                $table->dropConstrainedForeignId('seller_tier_id');
            }
        });

        Schema::dropIfExists('seller_tiers');
    }
};