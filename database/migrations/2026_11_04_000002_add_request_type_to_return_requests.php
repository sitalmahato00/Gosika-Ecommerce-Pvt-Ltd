<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('return_requests', function (Blueprint $table) {
            // Request type: what the customer wants
            $table->string('request_type', 30)->default('return_refund')->after('reason_type');
            // Preferred resolution chosen by customer
            $table->string('preferred_resolution', 80)->nullable()->after('request_type');
            // Return logistics
            $table->string('return_method', 30)->nullable()->after('preferred_resolution'); // pickup | drop_off
            $table->text('pickup_instructions')->nullable()->after('return_method');
            // Inspection by seller
            $table->string('inspection_condition', 30)->nullable()->after('pickup_instructions'); // good|damaged|defective|missing_parts
            $table->text('inspection_notes')->nullable()->after('inspection_condition');
            $table->json('inspection_photos')->nullable()->after('inspection_notes');
            $table->timestamp('inspected_at')->nullable()->after('inspection_photos');
            $table->foreignId('inspected_by')->nullable()->after('inspected_at')->constrained('users')->nullOnDelete();
            // Exchange tracking
            $table->foreignId('exchange_order_id')->nullable()->after('inspected_by')->constrained('orders')->nullOnDelete();
            $table->timestamp('exchange_dispatched_at')->nullable()->after('exchange_order_id');
            $table->timestamp('replacement_dispatched_at')->nullable()->after('exchange_dispatched_at');
            // Closed timestamp
            $table->timestamp('closed_at')->nullable()->after('replacement_dispatched_at');
        });
    }

    public function down(): void
    {
        Schema::table('return_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inspected_by');
            $table->dropConstrainedForeignId('exchange_order_id');
            $table->dropColumn([
                'request_type',
                'preferred_resolution',
                'return_method',
                'pickup_instructions',
                'inspection_condition',
                'inspection_notes',
                'inspection_photos',
                'inspected_at',
                'exchange_dispatched_at',
                'replacement_dispatched_at',
                'closed_at',
            ]);
        });
    }
};
