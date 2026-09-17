<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cms_pages', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('title', 180);
            $table->string('slug', 200)->unique();
            $table->string('excerpt', 400)->nullable();
            $table->longText('body')->nullable();
            $table->string('type', 20)->default('policy')->index(); // page | policy
            $table->string('status', 20)->default('draft')->index(); // draft | published
            $table->json('meta')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cms_pages');
    }
};