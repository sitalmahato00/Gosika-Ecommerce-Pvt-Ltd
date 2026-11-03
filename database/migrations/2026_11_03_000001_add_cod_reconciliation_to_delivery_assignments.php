<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_assignments', function (Blueprint $table) {
            $table->timestamp('cod_reconciled_at')->nullable()->after('delivered_at');
            $table->foreignId('cod_reconciled_by')->nullable()->after('cod_reconciled_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('delivery_assignments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cod_reconciled_by');
            $table->dropColumn('cod_reconciled_at');
        });
    }
};
