<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_kycs', function (Blueprint $table) {
            $table->string('province', 100)->nullable()->after('address');
            $table->string('district', 100)->nullable()->after('province');
            $table->string('municipality', 120)->nullable()->after('district');
            $table->string('latitude', 20)->nullable()->after('municipality');
            $table->string('longitude', 20)->nullable()->after('latitude');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_kycs', function (Blueprint $table) {
            $table->dropColumn(['province', 'district', 'municipality', 'latitude', 'longitude']);
        });
    }
};