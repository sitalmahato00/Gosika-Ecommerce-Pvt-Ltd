<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->warn('DatabaseSeeder contains QA-only data and was skipped in production.');

            return;
        }

        $this->call([
            RolePermissionSeeder::class,
            NepalGeoSchemaSeeder::class,
            SettingsSeeder::class,
            CatalogSeeder::class,
            CategoryCommissionSeeder::class,
            QaTestDataSeeder::class,
        ]);
    }
}
