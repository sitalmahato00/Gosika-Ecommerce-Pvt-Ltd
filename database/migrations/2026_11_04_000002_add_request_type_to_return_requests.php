<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'request_type' => fn (Blueprint $table) => $table->string('request_type', 30)->default('return_refund'),
            'preferred_resolution' => fn (Blueprint $table) => $table->string('preferred_resolution', 80)->nullable(),
            'return_method' => fn (Blueprint $table) => $table->string('return_method', 30)->nullable(),
            'pickup_instructions' => fn (Blueprint $table) => $table->text('pickup_instructions')->nullable(),
            'inspection_condition' => fn (Blueprint $table) => $table->string('inspection_condition', 30)->nullable(),
            'inspection_notes' => fn (Blueprint $table) => $table->text('inspection_notes')->nullable(),
            'inspection_photos' => fn (Blueprint $table) => $table->json('inspection_photos')->nullable(),
            'inspected_at' => fn (Blueprint $table) => $table->timestamp('inspected_at')->nullable(),
            'inspected_by' => fn (Blueprint $table) => $table->foreignId('inspected_by')->nullable()->constrained('users')->nullOnDelete(),
            'exchange_order_id' => fn (Blueprint $table) => $table->foreignId('exchange_order_id')->nullable()->constrained('orders')->nullOnDelete(),
            'exchange_dispatched_at' => fn (Blueprint $table) => $table->timestamp('exchange_dispatched_at')->nullable(),
            'replacement_dispatched_at' => fn (Blueprint $table) => $table->timestamp('replacement_dispatched_at')->nullable(),
            'closed_at' => fn (Blueprint $table) => $table->timestamp('closed_at')->nullable(),
        ];

        $missingColumns = array_filter(
            $columns,
            fn ($definition, $column) => ! Schema::hasColumn('return_requests', $column),
            ARRAY_FILTER_USE_BOTH
        );

        if ($missingColumns === []) {
            return;
        }

        Schema::table('return_requests', function (Blueprint $table) use ($missingColumns) {
            foreach ($missingColumns as $definition) {
                $definition($table);
            }
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
