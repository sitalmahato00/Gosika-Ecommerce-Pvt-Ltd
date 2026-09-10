<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['campaigns', 'cms_pages', 'vendor_promotions'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                if (! Schema::hasColumn($table, 'created_by')) {
                    $blueprint->unsignedBigInteger('created_by')->nullable();
                }
                if (! Schema::hasColumn($table, 'updated_by')) {
                    $blueprint->unsignedBigInteger('updated_by')->nullable();
                }
                if (! Schema::hasColumn($table, 'deleted_by')) {
                    $blueprint->unsignedBigInteger('deleted_by')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach (['campaigns', 'cms_pages', 'vendor_promotions'] as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                foreach (['created_by', 'updated_by', 'deleted_by'] as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $blueprint->dropColumn($column);
                    }
                }
            });
        }
    }
};