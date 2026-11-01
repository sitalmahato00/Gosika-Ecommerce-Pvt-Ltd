<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_kycs', function (Blueprint $table) {
            $table->string('landmark', 255)->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_kycs', function (Blueprint $table) {
            $table->dropColumn('landmark');
        });
    }
};
