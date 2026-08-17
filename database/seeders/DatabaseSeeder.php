<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\UserStatus;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            NepalGeoSchemaSeeder::class,
            SettingsSeeder::class,
            CatalogSeeder::class,
        ]);

        // Create default vendor BEFORE ProductSeeder
        $vendorUser = User::updateOrCreate(
            ['email' => 'vendor@gosika.com.np'],
            [
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'first_name' => 'Himalayan',
                'last_name' => 'Handicrafts',
                'phone' => '9800000003',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'status' => UserStatus::ACTIVE,
            ]
        );
        $vendorUser->assignRole(Roles::VENDOR_ADMIN);

        \App\Modules\Vendor\Infrastructure\Models\Vendor::query()->updateOrCreate(
            ['user_id' => $vendorUser->id],
            [
                'company_name' => 'Himalayan Handicrafts',
                'business_email' => 'vendor@gosika.com.np',
                'status' => \App\Modules\Shared\Domain\Enums\VendorStatus::APPROVED,
                'commission_rate' => 10,
            ]
        );

        // Now call ProductSeeder after vendor is created
        $this->call([
            ProductSeeder::class,
            DeliveryPartnerSeeder::class,
        ]);
    }
}
