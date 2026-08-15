<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Shared\Domain\Enums\UserStatus;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            NepalGeoSchemaSeeder::class,
            SettingsSeeder::class,
            CatalogSeeder::class,
        ]);

        $superAdmin = User::updateOrCreate(
            ['email' => 'admin@gosika.com.np'],
            [
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'first_name' => 'GOSIKA',
                'last_name' => 'Super Admin',
                'phone' => '9800000001',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'status' => UserStatus::ACTIVE,
            ]
        );
        $superAdmin->assignRole(Roles::SUPER_ADMIN);

        $customer = User::updateOrCreate(
            ['email' => 'customer@gosika.com.np'],
            [
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'first_name' => 'John',
                'last_name' => 'Doe',
                'phone' => '9800000002',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'status' => UserStatus::ACTIVE,
            ]
        );
        $customer->assignRole(Roles::CUSTOMER);
    }
}
