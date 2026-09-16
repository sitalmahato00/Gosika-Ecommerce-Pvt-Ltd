<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['vendor_notifications', 'customer_notifications', 'admin_notifications', 'delivery_notifications'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->unsignedBigInteger('created_by')->nullable()->index();
                $table->unsignedBigInteger('updated_by')->nullable()->index();
            });
        }
    }

    public function down(): void
    {
        foreach (['vendor_notifications', 'customer_notifications', 'admin_notifications', 'delivery_notifications'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn(['created_by', 'updated_by']);
            });
        }
    }
};