<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_partners', function (Blueprint $table) {
            $table->string('vehicle_model', 60)->nullable()->after('vehicle_number');
            $table->string('vehicle_color', 30)->nullable()->after('vehicle_model');
            $table->year('vehicle_year')->nullable()->after('vehicle_color');
            $table->date('insurance_expiry')->nullable()->after('vehicle_year');
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

        Schema::table('delivery_partners', function (Blueprint $table) {
            $table->dropColumn(['insurance_expiry', 'vehicle_year', 'vehicle_color', 'vehicle_model']);
        });
    }
};