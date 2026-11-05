<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addPickupCollectedAt = ! Schema::hasColumn('return_requests', 'pickup_collected_at');
        $addPickupCollectedBy = ! Schema::hasColumn('return_requests', 'pickup_collected_by');

        if (! $addPickupCollectedAt && ! $addPickupCollectedBy) {
            return;
        }

        Schema::table('return_requests', function (Blueprint $table) use ($addPickupCollectedAt, $addPickupCollectedBy) {
            if ($addPickupCollectedAt) {
                $table->timestamp('pickup_collected_at')->nullable();
            }

            if ($addPickupCollectedBy) {
                $table->foreignId('pickup_collected_by')->nullable()->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('return_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pickup_collected_by');
            $table->dropColumn('pickup_collected_at');
        });
    }
};
