<?php

use App\Modules\Identity\Domain\Permissions;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        $this->syncRoles([
            'vendor_admin' => [
                Permissions::ORDERS_MANAGE,
            ],
            'delivery_partner' => [],
        ]);
    }

    public function down(): void
    {
        $this->syncRoles([
            'vendor_admin' => [
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
            'delivery_partner' => [
                Permissions::ORDERS_VIEW,
                Permissions::DELIVERIES_MANAGE,
            ],
        ]);
    }

    private function syncRoles(array $roles): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        DB::transaction(function () use ($roles) {
            foreach (Permissions::ALL as $permission) {
                Permission::query()->updateOrCreate(['name' => $permission], ['guard_name' => 'web']);
            }

            foreach ($roles as $name => $permissions) {
                $role = Role::query()->where('name', $name)->first();

                if ($role) {
                    $role->syncPermissions($permissions);
                }
            }
        });
    }
};
