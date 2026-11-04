<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('return_request_media', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->foreignId('return_request_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20)->default('photo'); // photo | video
            $table->string('path', 500);
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size')->nullable();      // bytes
            $table->string('original_name', 255)->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('return_request_id');
        });

        Schema::create('return_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('return_request_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);
            $table->text('notes')->nullable();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('return_request_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('return_status_history');
        Schema::dropIfExists('return_request_media');
    }
};
