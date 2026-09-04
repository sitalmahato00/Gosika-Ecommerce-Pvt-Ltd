<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            if (! Schema::hasColumn('settings', 'description')) {
                $table->string('description', 255)->nullable()->after('type');
            }
            if (! Schema::hasColumn('settings', 'is_encrypted')) {
                $table->boolean('is_encrypted')->default(false)->after('is_public');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            if (Schema::hasColumn('settings', 'is_encrypted')) {
                $table->dropColumn('is_encrypted');
            }
            if (Schema::hasColumn('settings', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
