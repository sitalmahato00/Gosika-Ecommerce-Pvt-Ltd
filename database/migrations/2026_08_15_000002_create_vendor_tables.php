<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('company_name', 180);
            $table->string('business_email')->unique();
            $table->string('business_phone', 20)->nullable();
            $table->string('pan_vat', 30)->nullable()->index();
            $table->string('registration_number', 60)->nullable();
            $table->string('logo')->nullable();
            $table->string('status', 25)->default('pending')->index();
            $table->string('commission_rate')->nullable()->comment('Overrides platform default when set');
            $table->text('rejection_reason')->nullable();
            $table->json('meta')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
        });

        Schema::create('vendor_kycs', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->string('owner_full_name', 180);
            $table->string('owner_citizenship_number', 40)->nullable();
            $table->string('owner_email')->nullable();
            $table->string('owner_phone', 20)->nullable();
            $table->string('business_type', 60)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('status', 30)->default('draft')->index();
            $table->text('review_notes')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('vendor_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('vendor_kyc_id')->nullable()->constrained()->nullOnDelete();
            $table->string('document_type', 40)->index();
            $table->string('file_path');
            $table->string('mime_type', 80)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('status', 25)->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('stores', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->string('name', 180);
            $table->string('slug', 200)->unique();
            $table->string('logo')->nullable();
            $table->string('banner')->nullable();
            $table->text('description')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone', 20)->nullable();
            $table->string('status', 30)->default('draft')->index();
            $table->text('rejection_reason')->nullable();
            $table->json('settings')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
        });

        Schema::create('store_addresses', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->string('address_type', 30)->default('business');
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
            $table->timestamps();
        });

        Schema::create('store_operating_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week')->comment('0=Sunday ... 6=Saturday');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->unique(['store_id', 'day_of_week']);
        });

        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_id')->constrained()->cascadeOnDelete();
            $table->string('bank_name', 120);
            $table->string('branch_name', 120)->nullable();
            $table->string('account_name', 180);
            $table->string('account_number', 60);
            $table->string('account_type', 20)->default('savings');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['vendor_id', 'account_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('store_operating_hours');
        Schema::dropIfExists('store_addresses');
        Schema::dropIfExists('stores');
        Schema::dropIfExists('vendor_documents');
        Schema::dropIfExists('vendor_kycs');
        Schema::dropIfExists('vendors');
    }
};
