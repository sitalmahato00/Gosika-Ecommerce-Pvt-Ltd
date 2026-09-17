<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name', 150);
            $table->string('slug', 170)->unique();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('icon')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->unsignedBigInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('name', 150);
            $table->string('slug', 170)->unique();
            $table->string('logo')->nullable();
            $table->string('description', 1000)->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('brand_requests', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->string('brand_name', 150);
            $table->text('reason', 1000)->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 200);
            $table->string('slug', 220);
            $table->text('description')->nullable();
            $table->text('short_description')->nullable();
            $table->string('sku', 80)->index();
            $table->string('barcode', 80)->nullable();
            $table->string('status', 25)->default('draft')->index();
            $table->string('stock_status', 20)->default('in_stock')->index();
            $table->unsignedBigInteger('quantity')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(5);
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('compare_at_price', 12, 2)->nullable();
            $table->decimal('cost_price', 12, 2)->nullable();
            $table->string('currency', 3)->default('NPR');
            $table->unsignedBigInteger('weight_grams')->default(0);
            $table->string('dimensions', 60)->nullable();
            $table->string('hs_code', 20)->nullable();
            $table->unsignedTinyInteger('tax_rate')->default(0);
            $table->string('manufacturer')->nullable();
            $table->boolean('is_variant')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_negotiable')->default(false);
            $table->unsignedBigInteger('views_count')->default(0);
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedBigInteger('rating_count')->default(0);
            $table->json('meta')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['vendor_id', 'sku']);
            $table->index(['status', 'stock_status']);
            $table->index(['price']);
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('sku', 80)->index();
            $table->string('name', 200)->nullable();
            $table->string('combination_hash', 64)->nullable()->index();
            $table->decimal('price', 12, 2)->default(0);
            $table->decimal('compare_at_price', 12, 2)->nullable();
            $table->unsignedBigInteger('quantity')->default(0);
            $table->string('stock_status', 20)->default('in_stock');
            $table->string('image')->nullable();
            $table->json('options')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['product_id', 'sku']);
        });

        Schema::create('product_images', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->string('file_path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        Schema::create('product_attributes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->string('type', 20)->default('text');
            $table->timestamps();
        });

        Schema::create('product_attribute_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attribute_id')->constrained('product_attributes')->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->string('value', 255);
            $table->timestamps();
        });

        Schema::create('product_questions', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('question', 500);
            $table->string('status', 20)->default('pending')->index();
            $table->string('answer', 1000)->nullable();
            $table->unsignedBigInteger('answered_by')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['product_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_questions');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('product_attribute_values');
        Schema::dropIfExists('product_attributes');
        Schema::dropIfExists('product_images');
        Schema::dropIfExists('products');
        Schema::dropIfExists('brand_requests');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('categories');
    }
};
