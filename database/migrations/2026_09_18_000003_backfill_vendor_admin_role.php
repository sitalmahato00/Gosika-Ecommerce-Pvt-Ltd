<?php

use App\Modules\Identity\Infrastructure\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        DB::transaction(function () {
            $role = Role::query()->updateOrCreate(['name' => 'vendor_admin'], ['guard_name' => 'web']);

            User::query()
                ->whereHas('vendor')
                ->whereDoesntHave('roles', fn ($q) => $q->where('name', 'vendor_admin'))
                ->get()
                ->each(fn (User $user) => $user->assignRole($role));
        });
    }

    public function down(): void
    {
        DB::transaction(function () {
            User::query()
                ->whereHas('vendor')
                ->get()
                ->each(function (User $user) {
                    $user->removeRole('vendor_admin');
                });
        });
    }
};