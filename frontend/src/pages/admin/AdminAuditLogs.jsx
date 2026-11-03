import React, { useMemo, useState } from 'react'
import { Shield, Download } from 'lucide-react'
import api from '../../api/client'
import { useList } from '../../hooks/useApi'
import FilterBar from '../../components/admin/FilterBar'
import ExportScopeNote from '../../components/admin/ExportScopeNote'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import Pagination from '../../components/ui/Pagination'
import { formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

const formatDiff = (v) => {
  if (v == null || v === '') return '—'
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

export default function AdminAuditLogs() {
  const toast = useToast()
  const { user } = useAuth()
  const branding = useBranding()
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appliedDateRange, setAppliedDateRange] = useState({ from: '', to: '' })

  const fetcher = async (page) => api.get('/admin/audit-logs', {
    params: {
      page,
      per_page: 20,
      action: actionFilter || undefined,
      search: search || undefined,
      date_from: appliedDateRange.from || undefined,
      date_to: appliedDateRange.to || undefined,
    },
  })

  const { items, meta, page, setPage, loading, error, reload } = useList(fetcher, {
    deps: [actionFilter, search, appliedDateRange],
    pageSize: 20,
  })

  const actionOptions = useMemo(() => [...new Set(items.map((l) => l.action).filter(Boolean))].sort(), [items])

  const exportLogs = () => {
    if (!items.length) {
      toast.error('No audit log entries to export.')
      return
    }
    exportReportFromRows({
      columns: [
        { label: 'Log ID' },
        { label: 'Admin User' },
        { label: 'Action Performed' },
        { label: 'Target Resource' },
        { label: 'Previous Value' },
        { label: 'New Value' },
        { label: 'IP Address' },
        { label: 'Timestamp' },
      ],
      rows: items.map((l) => [
        l.id,
        l.user?.name || 'System',
        l.action,
        l.resource_type ? `${l.resource_type}${l.resource_id != null ? ` #${l.resource_id}` : ''}` : '—',
        formatDiff(l.old_values),
        formatDiff(l.new_values),
        l.ip_address || '—',
        formatDateTime(l.created_at),
      ]),
      title: 'Security Audit & Activity Log',
      subtitle: 'Immutable forensic record of administrative modifications, approvals, payments, and system accesses.',
      sectionLabel: 'Audit Log',
      fileName: `gosika_audit_log_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Audit security log exported as branded report.')
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={48} />)}
      </div>
    )
  }

  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Security Audit & Activity Logs</h1>
          <p>Immutable forensic record of all administrative modifications, approvals, payments, and system accesses</p>
        </div>
        <div className="flex items-center gap-2 wrap">
          <ExportScopeNote />
          <button className="btn btn-outline btn-sm" onClick={exportLogs}>
            <Download size={14} /> Export Audit Log
          </button>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={value => { setPage(1); setSearch(value) }}
        searchPlaceholder="Search by user, action, resource, IP…"
        debounceMs={350}
        statusFilter={actionFilter || 'all'}
        onStatusChange={value => { setPage(1); setActionFilter(value === 'all' ? '' : value) }}
        statusOptions={actionOptions.map(action => ({ value: action, label: action }))}
        fromDate={dateFrom}
        toDate={dateTo}
        onFromDateChange={setDateFrom}
        onToDateChange={setDateTo}
        onApplyFilters={() => {
          setPage(1)
          setAppliedDateRange({ from: dateFrom, to: dateTo })
        }}
        onReset={() => {
          setPage(1)
          setSearch('')
          setActionFilter('')
          setDateFrom('')
          setDateTo('')
          setAppliedDateRange({ from: '', to: '' })
        }}
      />

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Admin User</th>
              <th>Action Performed</th>
              <th>Target Resource</th>
              <th>Previous Value</th>
              <th>New Value</th>
              <th>IP Address</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id}>
                <td>
                  <span className="font-mono text-xs text-muted">#{l.id}</span>
                </td>
                <td>
                  <span className="font-semibold text-sm text-ink">{l.user?.name || 'System'}</span>
                  {l.user?.email && <div className="muted text-xs">{l.user.email}</div>}
                </td>
                <td>
                  <span className="badge badge-primary">{l.action}</span>
                </td>
                <td className="text-sm font-medium">
                  <span className="font-mono text-xs">{l.resource_type || '—'}</span>
                  {l.resource_id != null && <span className="muted text-xs"> #{l.resource_id}</span>}
                </td>
                <td className="muted text-xs font-mono" style={{ maxWidth: 200 }}>{formatDiff(l.old_values)}</td>
                <td className="text-xs font-mono text-success font-semibold" style={{ maxWidth: 200 }}>{formatDiff(l.new_values)}</td>
                <td className="muted text-xs">{l.ip_address || '—'}</td>
                <td className="muted text-xs whitespace-nowrap">{formatDateTime(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!items.length && (
        <div style={{ marginTop: 16 }}>
          <EmptyState icon={Shield} title="No audit logs" message="No log entries match the current filters." />
        </div>
      )}

      <Pagination page={page} lastPage={meta.last_page} total={meta.total} onChange={setPage} />
    </div>
  )
}
