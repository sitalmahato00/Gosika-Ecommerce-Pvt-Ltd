<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_partners', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 180);
            $table->string('phone', 20)->unique();
            $table->string('email')->nullable();
            $table->string('vehicle_type', 40)->nullable();
            $table->string('vehicle_number', 30)->nullable();
            $table->string('vehicle_model', 60)->nullable();
            $table->string('vehicle_color', 30)->nullable();
            $table->year('vehicle_year')->nullable();
            $table->date('insurance_expiry')->nullable();
            $table->json('service_areas')->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->boolean('is_online')->default(false);
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedBigInteger('rating_count')->default(0);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamp('last_location_at')->nullable();
            $table->json('meta')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('delivery_assignments', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('vendor_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('delivery_partner_id')->constrained()->cascadeOnDelete();
            $table->string('status', 25)->default('assigned')->index();
            $table->decimal('delivery_fee', 12, 2)->default(0);
            $table->decimal('cod_amount', 12, 2)->default(0)->comment('Collected amount for COD orders');
            $table->string('pickup_address', 500)->nullable();
            $table->string('dropoff_address', 500)->nullable();
            $table->string('recipient_name', 180)->nullable();
            $table->string('recipient_phone', 20)->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('out_for_delivery_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->string('failure_reason', 500)->nullable();
            $table->string('proof_photo')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['delivery_partner_id', 'status']);
            $table->index(['vendor_order_id']);
        });

        Schema::create('delivery_tracking', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('assignment_id')->constrained('delivery_assignments')->cascadeOnDelete();
            $table->foreignId('vendor_order_id')->constrained()->cascadeOnDelete();
            $table->string('status', 25);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('note')->nullable();
            $table->timestamp('tracked_at')->index();
            $table->timestamps();
        });

        Schema::create('delivery_partner_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('delivery_partner_id')->constrained()->cascadeOnDelete();
            $table->string('document_type', 40)->index();
            $table->string('file_path');
            $table->string('mime_type', 80)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('status', 25)->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_partner_documents');
        Schema::dropIfExists('delivery_tracking');
        Schema::dropIfExists('delivery_assignments');
        Schema::dropIfExists('delivery_partners');
    }
};
