<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ReturnRequestMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_return_request_migrations_resume_when_some_columns_already_exist(): void
    {
        Schema::table('return_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pickup_collected_by');
            $table->dropColumn('preferred_resolution');
        });

        $pickupMigration = require database_path('migrations/2026_11_04_000001_add_pickup_confirmation_to_return_requests.php');
        $requestTypeMigration = require database_path('migrations/2026_11_04_000002_add_request_type_to_return_requests.php');

        $pickupMigration->up();
        $requestTypeMigration->up();
        $pickupMigration->up();
        $requestTypeMigration->up();

        $this->assertTrue(Schema::hasColumn('return_requests', 'pickup_collected_at'));
        $this->assertTrue(Schema::hasColumn('return_requests', 'pickup_collected_by'));
        $this->assertTrue(Schema::hasColumn('return_requests', 'preferred_resolution'));

        Schema::table('return_requests', function (Blueprint $table) {
            $table->dropUnique('return_requests_return_number_unique');
            $table->dropColumn('return_number');
        });

        $returnNumberMigration = require database_path('migrations/2026_11_05_000001_repair_return_request_numbers.php');
        $returnNumberMigration->up();
        $returnNumberMigration->up();

        $this->assertTrue(Schema::hasColumn('return_requests', 'return_number'));
        $this->assertTrue(Schema::hasIndex('return_requests', 'return_requests_return_number_unique', 'unique'));
    }
}
