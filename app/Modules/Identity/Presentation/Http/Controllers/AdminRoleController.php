<?php

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdminRoleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::USERS_MANAGE_ROLES);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::with('permissions')->orderBy('id')->get()->map(function (Role $role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'label' => $this->labelFor($role->name),
                'permissions' => $role->permissions->pluck('name'),
                'is_system' => in_array($role->name, Roles::ALL, true),
                'users_count' => $role->users()->count(),
            ];
        });

        return Response::success($roles, 'Roles retrieved.');
    }

    public function permissions(): JsonResponse
    {
        $grouped = collect(Permissions::ALL)->groupBy(fn ($p) => str($p)->before('.')->toString());

        return Response::success($grouped, 'Permissions retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:roles,name'],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'in:'.implode(',', Permissions::ALL)],
        ]);

        $role = DB::transaction(function () use ($data) {
            $role = Role::create(['name' => str($data['name'])->slug('_')->toString(), 'guard_name' => 'web']);
            $role->syncPermissions($data['permissions'] ?? []);

            return $role->load('permissions');
        });

        app(AuditLogService::class)->record($request->user(), 'role.created', 'role', $role->id, null, ['name' => $role->name, 'permissions' => $role->permissions->pluck('name')]);

        return Response::created($role, 'Role created.');
    }
    public function update(Request $request, Role $role): JsonResponse
    {
        if (in_array($role->name, Roles::ALL, true)) {
            throw new DomainException('System roles cannot be renamed or deleted.', 422);
        }

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', 'unique:roles,name,'.$role->id],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'in:'.implode(',', Permissions::ALL)],
        ]);

        DB::transaction(function () use ($role, $data) {
            if (isset($data['name'])) {
                $role->update(['name' => str($data['name'])->slug('_')->toString()]);
            }

            if (array_key_exists('permissions', $data)) {
                $role->syncPermissions($data['permissions'] ?? []);
            }
        });

        app(AuditLogService::class)->record($request->user(), 'role.updated', 'role', $role->id, null, ['name' => $role->name, 'permissions' => $data['permissions'] ?? $role->permissions->pluck('name')->toArray()]);

        return Response::success($role->load('permissions'), 'Role updated.');
    }

    public function destroy(Role $role): JsonResponse
    {
        if (in_array($role->name, Roles::ALL, true)) {
            throw new DomainException('System roles cannot be deleted.', 422);
        }

        $role->delete();

        app(AuditLogService::class)->record(request()->user(), 'role.deleted', 'role', $role->id, null, ['name' => $role->name]);

        return Response::success(null, 'Role deleted.');
    }

    protected function labelFor(string $name): string
    {
        return match ($name) {
            Roles::SUPER_ADMIN => 'Super Admin',
            Roles::VENDOR_ADMIN => 'Vendor Admin',
            Roles::DELIVERY_PARTNER => 'Delivery Partner',
            Roles::CUSTOMER => 'Customer',
            default => ucwords(str_replace('_', ' ', $name)),
        };
    }
}
