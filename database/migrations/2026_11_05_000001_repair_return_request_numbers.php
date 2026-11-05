<?php

use App\Modules\Shared\Infrastructure\Services\ReferenceNumber;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('return_requests')) {
            throw new RuntimeException('The return_requests table must exist before repairing return numbers.');
        }

        if (! Schema::hasColumn('return_requests', 'return_number')) {
            Schema::table('return_requests', function (Blueprint $table) {
                $table->string('return_number', 40)->nullable()->unique();
            });
        }

        DB::table('return_requests')
            ->where(function ($query) {
                $query->whereNull('return_number')->orWhere('return_number', '');
            })
            ->orderBy('id')
            ->chunkById(100, function ($returns) {
                foreach ($returns as $return) {
                    DB::table('return_requests')
                        ->where('id', $return->id)
                        ->update(['return_number' => ReferenceNumber::unique('RTN')]);
                }
            });
    }

    public function down(): void
    {
        // Keep repaired identifiers; removing them would make existing returns ambiguous.
    }
};
