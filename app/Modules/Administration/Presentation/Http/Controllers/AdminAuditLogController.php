<?php

namespace App\Modules\Administration\Presentation\Http\Controllers;

use App\Modules\Administration\Infrastructure\Models\AuditLog;
use App\Modules\Administration\Presentation\Resources\AuditLogResource;
use App\Modules\Identity\Domain\Permissions;
use App\Modules\Identity\Domain\Roles;
use App\Modules\Shared\Presentation\Http\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class AdminAuditLogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('admin');
        $this->middleware('permission:'.Permissions::ANALYTICS_VIEW);
    }

    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::query()
            ->with('user')
            ->when($request->input('action'), fn ($q, $s) => $q->where('action', $s))
            ->when($request->input('resource_type'), fn ($q, $s) => $q->where('resource_type', $s))
            ->when($request->input('search'), function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner->where('action', 'like', "%{$search}%")
                        ->orWhere('resource_type', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                });
            })
            ->when($request->input('date_from'), fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->input('date_to'), fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return Response::success(
            AuditLogResource::collection($logs),
            'Audit logs retrieved.',
            ['pagination' => [
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
            ]]
        );
    }
}
