<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['shipping_zones', 'couriers'] as $table) {
            Schema::table($table, function (Blueprint $tableBlueprint) {
                $tableBlueprint->unsignedBigInteger('created_by')->nullable();
                $tableBlueprint->unsignedBigInteger('updated_by')->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['shipping_zones', 'couriers'] as $table) {
            Schema::table($table, function (Blueprint $tableBlueprint) {
                $tableBlueprint->dropColumn(['created_by', 'updated_by']);
            });
        }
    }
};
