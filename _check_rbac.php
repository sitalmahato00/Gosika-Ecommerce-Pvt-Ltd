<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

echo 'Roles: ' . Role::count() . PHP_EOL;
foreach (Role::withCount('users', 'permissions')->get() as $r) {
    echo "  {$r->name} | guard={$r->guard_name} | users={$r->users_count} | perms={$r->permissions_count}" . PHP_EOL;
}

echo 'Permissions: ' . Permission::count() . PHP_EOL;

$expected = App\Modules\Identity\Domain\Permissions::ALL;
$db = Permission::pluck('name')->all();
$missing = array_diff($expected, $db);
$extra = array_diff($db, $expected);
echo 'Missing from DB: ' . (count($missing) ? implode(', ', $missing) : 'none') . PHP_EOL;
echo 'Extra in DB: ' . (count($extra) ? implode(', ', $extra) : 'none') . PHP_EOL;

$super = Role::where('name', 'super_admin')->first();
if ($super) {
    $superPerms = $super->permissions->pluck('name')->all();
    $notGranted = array_diff($expected, $superPerms);
    echo 'Super admin missing: ' . (count($notGranted) ? implode(', ', $notGranted) : 'none') . PHP_EOL;
}
