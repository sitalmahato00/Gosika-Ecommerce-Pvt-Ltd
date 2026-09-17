<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id();
            $table->uuid()->unique();
            $table->string('title', 200);
            $table->text('message');
            $table->string('channel', 20)->default('in_app')->comment('email|sms|push|in_app');
            $table->string('target_type', 30)->default('all')->comment('all|customers|vendors|delivery');
            $table->json('target_ids')->nullable();
            $table->string('status', 20)->default('sent');
            $table->unsignedBigInteger('reach')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['target_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broadcasts');
    }
};
