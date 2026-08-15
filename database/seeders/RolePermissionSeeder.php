<?php

namespace Database\Seeders;

use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (Permissions::ALL as $permission) {
            Permission::query()->updateOrCreate(['name' => $permission], ['guard_name' => 'web']);
        }

        $roles = [
            Roles::SUPER_ADMIN => Permissions::ALL,
            Roles::VENDOR_ADMIN => [
                Permissions::ORDERS_MANAGE,
            ],
            Roles::DELIVERY_PARTNER => [],
            Roles::CUSTOMER => [],
        ];

        DB::transaction(function () use ($roles) {
            foreach ($roles as $roleName => $permissions) {
                $role = Role::query()->updateOrCreate(['name' => $roleName], ['guard_name' => 'web']);
                $role->syncPermissions($permissions);
            }
        });
    }
}
