import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileSpreadsheet, Calendar, CheckCircle2, Search,
  Download, Clock, Plus, Building2, Percent, Check, X, RefreshCw
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDateTime, formatDate, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

export default function AdminSettlements() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateForm, setGenerateForm] = useState({ vendor_id: '', period_start: '', period_end: '' })
  const [generating, setGenerating] = useState(false)
  const [vendors, setVendors] = useState([])

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject'
    settlement: null,
    loading: false
  })

  useEffect(() => {
    api.get('/admin/vendors', { params: { per_page: 100 } })
      .then(res => setVendors(api.unwrapList(res.data)))
      .catch(() => {})
  }, [])

  const loadSettlements = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/wallet/settlements', { params })
      const data = api.unwrapList(res.data)
      setSettlements(data)
      if (res.data?.meta?.pagination) {
        setPagination(res.data.meta.pagination)
      } else {
        setPagination({
          current_page: page,
          last_page: 1,
          total: data.length,
          per_page: 15
        })
      }
    } catch (err) {
      toast.error('Failed to load settlement statements.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettlements()
  }, [page, statusFilter])

  const handleAction = (action, settlement) => {
    setDialogState({
      isOpen: true,
      action,
      settlement,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, settlement } = dialogState
    if (!settlement) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = settlement.uuid || settlement.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/wallet/settlements/${targetId}/approve`)
        toast.success(`Settlement statement #${settlement.settlement_number || settlement.id} approved.`)
      } else if (action === 'reject') {
        await api.post(`/admin/wallet/settlements/${targetId}/reject`, { reason })
        toast.success(`Settlement rejected.`)
      }

      setDialogState({ isOpen: false, action: null, settlement: null, loading: false })
      loadSettlements()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settlement operation failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleGenerateSubmit = async (e) => {
    e.preventDefault()
    setGenerating(true)
    try {
      await api.post('/admin/wallet/settlements/generate', generateForm)
      toast.success('New settlement period batch generated successfully!')
      setGenerateOpen(false)
      setGenerateForm({ vendor_id: '', period_start: '', period_end: '' })
      loadSettlements()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate settlement statement.')
    } finally {
      setGenerating(false)
    }
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Settlement #' },
        { label: 'Vendor' },
        { label: 'Period Start' },
        { label: 'Period End' },
        { label: 'Gross Sales', align: 'right' },
        { label: 'Commission', align: 'right' },
        { label: 'Net Payable', align: 'right' },
        { label: 'Status' },
      ],
      rows: settlements.map(s => [
        s.settlement_number || s.id,
        s.vendor_name || s.vendor?.company_name || '',
        s.period_start || '',
        s.period_end || '',
        s.gross_sales || 0,
        s.commission_total || 0,
        s.net_payable || 0,
        s.status || ''
      ]),
      title: 'Vendor Settlements Report',
      subtitle: 'Periodic settlement statements with gross sales, commission and net payables.',
      sectionLabel: 'Settlement Ledger',
      fileName: `gosika_settlements_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Settlements exported as branded report.')
  }

  const columns = [
    {
      header: 'Settlement Ref',
      render: item => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
            #{item.settlement_number || item.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            Generated {timeAgo(item.created_at || item.generated_at)}
          </div>
        </div>
      )
    },
    {
      header: 'Merchant',
      render: item => (
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
          {item.vendor_name || item.vendor?.company_name || 'Vendor'}
        </div>
      )
    },
    {
      header: 'Statement Period',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
          {formatDate(item.period_start)} → {formatDate(item.period_end)}
        </span>
      )
    },
    {
      header: 'Gross Sales',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 700, fontSize: 13 }}>
          {money(item.gross_sales || 0)}
        </span>
      )
    },
    {
      header: 'Platform Commission',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13 }}>
          - {money(item.commission_total || 0)}
        </span>
      )
    },
    {
      header: 'Net Payable',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 900, color: '#16a34a', fontSize: 14 }}>
          {money(item.net_payable || 0)}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: item => <StatusBadge status={item.status} />
    },
    {
      header: 'Actions',
      align: 'right',
      render: item => {
        const isPending = item.status === 'pending'
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                  title="Approve Settlement"
                >
                  <Check size={12} style={{ marginRight: 3 }} /> Approve
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => handleAction('reject', item)}
                  title="Reject"
                >
                  <X size={12} /> Reject
                </button>
              </>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Periodic Settlements & Ledger"
        description="Reconcile multi-vendor sales cycles, calculate marketplace commissions, and authorize payout disbursements."
        breadcrumbs={[
          { label: 'Finance', to: '/admin/finance/payments' },
          { label: 'Settlements' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setGenerateOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Plus size={14} /> Generate Batch
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadSettlements}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by settlement # or vendor..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'pending', label: 'Pending Payout Approval' },
          { value: 'paid', label: 'Completed & Disbursed' },
          { value: 'rejected', label: 'Rejected' },
        ]}
        onReset={() => { setSearch(''); setStatusFilter('all') }}
      />

      <DataTable
        columns={columns}
        data={settlements}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No settlement statements"
        emptyDescription="There are no settlement batches matching your filters."
      />

      {/* Generate Batch Modal */}
      {generateOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={e => { if (e.target === e.currentTarget) setGenerateOpen(false) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Generate Periodic Settlement Batch
              </h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setGenerateOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleGenerateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Select Vendor *</label>
                <select
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 13, fontWeight: 600 }}
                  value={generateForm.vendor_id}
                  onChange={e => setGenerateForm({ ...generateForm, vendor_id: e.target.value })}
                  required
                >
                  <option value="">Choose a merchant...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.company_name} (PAN: {v.pan_vat || '—'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Period Start *</label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: 13 }}
                    value={generateForm.period_start}
                    onChange={e => setGenerateForm({ ...generateForm, period_start: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Period End *</label>
                  <input
                    type="date"
                    className="input"
                    style={{ width: '100%', height: 38, fontSize: 13 }}
                    value={generateForm.period_end}
                    onChange={e => setGenerateForm({ ...generateForm, period_end: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setGenerateOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={generating}>
                  {generating ? 'Calculating...' : 'Generate Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, settlement: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Settlement #${dialogState.settlement?.settlement_number || dialogState.settlement?.id}?`
            : `Reject Settlement #${dialogState.settlement?.settlement_number || dialogState.settlement?.id}?`
        }
        message={
          dialogState.action === 'approve'
            ? `Approving will credit ${money(dialogState.settlement?.net_payable || 0)} to the vendor wallet available balance.`
            : 'Rejecting this settlement requires an explanation.'
        }
        variant={dialogState.action === 'approve' ? 'success' : 'danger'}
        confirmText={dialogState.action === 'approve' ? 'Approve Settlement' : 'Reject'}
        requireReason={dialogState.action === 'reject'}
        reasonPlaceholder="Specify reason for rejecting settlement statement..."
      />
    </div>
  )
}
