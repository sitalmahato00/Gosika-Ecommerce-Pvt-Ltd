<?php

namespace App\Modules\Seo\Infrastructure\Models;

use App\Modules\Shared\Infrastructure\Models\BaseModel;

class SeoAuditResult extends BaseModel
{
    protected $table = 'seo_audit_results';

    protected $fillable = [
        'entity_type',
        'entity_id',
        'entity_url',
        'issue_type',
        'severity',
        'description',
        'recommendation',
        'is_resolved',
        'resolved_at',
        'resolved_by',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'is_resolved' => 'boolean',
            'resolved_at' => 'datetime',
        ];
    }
}
