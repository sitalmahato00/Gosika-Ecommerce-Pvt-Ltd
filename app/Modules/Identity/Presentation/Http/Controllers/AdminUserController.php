<?php

namespace App\Modules\Identity\Presentation\Http\Controllers;

use App\Modules\Administration\Application\Services\AuditLogService;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Identity\Infrastructure\Models\User;
use App\Modules\Identity\Presentation\Resources\UserResource;
use App\Modules\Shared\Domain\Enums\UserStatus;
use App\Modules\Shared\Domain\Exceptions\DomainException;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class AdminUserController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:'.Roles::SUPER_ADMIN);
        $this->middleware('permission:'.Permissions::USERS_VIEW);
        $this->middleware('permission:'.Permissions::USERS_DELETE)->only(['destroy']);
        $this->middleware('permission:'.Permissions::USERS_MANAGE_ROLES)->only(['assignRoles']);
    }

    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with('roles')
            ->when($request->input('role'), fn ($q, $r) => $q->role($r))
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return Response::success(
            UserResource::collection($users),
            'Users retrieved.',
            ['pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ]]
        );
    }

    public function show(string $userId): JsonResponse
    {
        $user = User::query()->with(['roles', 'vendor', 'customerProfile', 'addresses', 'deliveryPartner'])->where('uuid', $userId)->firstOrFail();

        return Response::success(new UserResource($user), 'User retrieved.');
    }

    public function suspend(Request $request, string $userId): JsonResponse
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $user = User::where('uuid', $userId)->firstOrFail();

        if ($user->id === $request->user()->id) {
            throw new DomainException('You cannot suspend your own account.');
        }

        $user->status = UserStatus::SUSPENDED;
        $user->meta = array_merge((array) $user->meta, ['suspended_reason' => $request->input('reason')]);
        $user->save();

        app(AuditLogService::class)->record($request->user(), 'user.suspended', 'user', $user->uuid, ['status' => 'active'], ['status' => 'suspended', 'reason' => $request->input('reason')]);

        return Response::success(new UserResource($user), 'User suspended.');
    }

    public function activate(string $userId): JsonResponse
    {
        $user = User::where('uuid', $userId)->firstOrFail();
        $user->status = UserStatus::ACTIVE;
        $user->save();

        app(AuditLogService::class)->record(request()->user(), 'user.activated', 'user', $user->uuid, ['status' => 'suspended'], ['status' => 'active']);

        return Response::success(new UserResource($user), 'User activated.');
    }

    public function assignRoles(Request $request, string $userId): JsonResponse
    {
        $request->validate([
            'roles' => ['required', 'array'],
            'roles.*' => ['string', 'in:'.implode(',', Roles::ALL)],
        ]);

        $user = User::where('uuid', $userId)->firstOrFail();

        DB::transaction(function () use ($user, $request) {
            $roles = Role::whereIn('name', $request->input('roles'))->get();
            $user->syncRoles($roles);
        });

        app(AuditLogService::class)->record($request->user(), 'user.roles_updated', 'user', $user->uuid, null, ['roles' => $request->input('roles')]);

        return Response::success(new UserResource($user->load('roles')), 'Roles updated.');
    }

    public function destroy(string $userId): JsonResponse
    {
        $user = User::where('uuid', $userId)->firstOrFail();

        if ($user->id === request()->user()->id) {
            throw new DomainException('You cannot delete your own account.');
        }

        $user->delete();

        app(AuditLogService::class)->record(request()->user(), 'user.deleted', 'user', $user->uuid, null, ['email' => $user->email]);

        return Response::success(null, 'User deleted.');
    }
}
