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
                Permissions::VENDORS_VIEW,
                Permissions::STORES_VIEW,
                Permissions::STORES_MANAGE,
                Permissions::PRODUCTS_VIEW,
                Permissions::PRODUCTS_CREATE,
                Permissions::PRODUCTS_UPDATE,
                Permissions::PRODUCTS_DELETE,
                Permissions::BRANDS_MANAGE,
                Permissions::ORDERS_VIEW,
                Permissions::ORDERS_MANAGE,
                Permissions::ORDERS_CANCEL,
                Permissions::ORDERS_REFUND,
                Permissions::PAYMENTS_VIEW,
                Permissions::WALLETS_VIEW,
                Permissions::PAYOUTS_REQUEST,
                Permissions::DELIVERIES_MANAGE,
                Permissions::ANALYTICS_VIEW,
                Permissions::TICKETS_VIEW,
            ],
            Roles::DELIVERY_PARTNER => [
                Permissions::ORDERS_VIEW,
                Permissions::DELIVERIES_MANAGE,
            ],
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
