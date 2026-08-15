<?php

namespace App\Modules\Administration\Application\Services;

use App\Modules\Administration\Infrastructure\Models\AuditLog;
use App\Modules\Identity\Infrastructure\Models\User;

class AuditLogService
{
    public function record(
        ?User $actor,
        string $action,
        string $resourceType,
        int|string|null $resourceId = null,
        ?array $old = null,
        ?array $new = null,
        ?array $meta = null
    ): AuditLog {
        return AuditLog::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'resource_type' => $resourceType,
            'resource_id' => is_numeric($resourceId) ? (int) $resourceId : null,
            'ip_address' => request()->ip(),
            'user_agent' => mb_substr((string) request()->userAgent(), 0, 500),
            'old_values' => $old,
            'new_values' => $new,
            'meta' => $meta,
        ]);
    }
}
