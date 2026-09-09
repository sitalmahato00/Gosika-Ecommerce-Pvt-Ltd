import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Banknote, Check, X, Eye, RefreshCw, Download,
  CheckCircle2, Building, User, Clock
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import FilterBar from '../../components/admin/FilterBar'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

export default function AdminPayouts() {
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject' | 'mark-paid'
    payout: null,
    loading: false
  })

  const loadPayouts = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter
      if (search.trim()) params.search = search.trim()

      const res = await api.get('/admin/wallet/payouts', { params })
      const data = api.unwrapList(res.data)
      setPayouts(data)
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
      toast.error('Failed to load payout requests.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayouts()
  }, [page, statusFilter])

  const handleAction = (action, payout) => {
    setDialogState({
      isOpen: true,
      action,
      payout,
      loading: false
    })
  }

  const handleConfirmAction = async (reason) => {
    const { action, payout } = dialogState
    if (!payout) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = payout.uuid || payout.id

    try {
      if (action === 'approve') {
        await api.post(`/admin/wallet/payouts/${targetId}/approve`)
        toast.success(`Payout #${payout.payout_number || payout.id} approved for disbursement.`)
      } else if (action === 'reject') {
        await api.post(`/admin/wallet/payouts/${targetId}/reject`, { reason })
        toast.success(`Payout request rejected. Funds returned to vendor available balance.`)
      } else if (action === 'mark-paid') {
        await api.post(`/admin/wallet/payouts/${targetId}/mark-paid`)
        toast.success(`Payout marked as paid / transferred.`)
      }

      setDialogState({ isOpen: false, action: null, payout: null, loading: false })
      loadPayouts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payout operation failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const exportCSV = () => {
    exportReportFromRows({
      columns: [
        { label: 'Payout #' },
        { label: 'Vendor' },
        { label: 'Bank Name' },
        { label: 'Account #' },
        { label: 'Amount', align: 'right' },
        { label: 'Status' },
        { label: 'Requested At' },
      ],
      rows: payouts.map(p => [
        p.payout_number || p.id,
        p.vendor_name || p.vendor?.company_name || '',
        p.bank_account?.bank_name || 'Bank Transfer',
        p.bank_account?.account_number || '',
        p.amount || 0,
        p.status || '',
        formatDateTime(p.created_at || p.requested_at)
      ]),
      title: 'Vendor Payouts Report',
      subtitle: 'Bank transfer payouts processed to merchant vendors with remittance details.',
      sectionLabel: 'Payout Ledger',
      fileName: `gosika_payouts_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Payouts exported as branded report.')
  }

  const columns = [
    {
      header: 'Payout #',
      render: item => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: 13 }}>
            #{item.payout_number || item.id}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {timeAgo(item.created_at || item.requested_at)}
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
      header: 'Disbursement Bank Account',
      render: item => {
        const bank = item.bank_account || item.bankAccount
        return bank ? (
          <div>
            <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ink)' }}>{bank.bank_name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
              Acct: {bank.account_number} ({bank.account_name})
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Bank Transfer</span>
        )
      }
    },
    {
      header: 'Payout Amount',
      align: 'right',
      render: item => (
        <span style={{ fontWeight: 900, color: '#16a34a', fontSize: 14 }}>
          {money(item.amount)}
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
        const isApproved = item.status === 'approved'

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
            {isPending && (
              <>
                <button
                  type="button"
                  className="btn btn-xs"
                  style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                  onClick={() => handleAction('approve', item)}
                  title="Approve Payout"
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

            {isApproved && (
              <button
                type="button"
                className="btn btn-xs"
                style={{ background: '#2563eb', color: '#fff', border: 'none' }}
                onClick={() => handleAction('mark-paid', item)}
                title="Mark Transfer Completed"
              >
                Mark Disbursed
              </button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Vendor Payout Requests"
        description="Verify vendor earnings withdrawals, check bank transfer details, approve payments, and confirm disbursements."
        breadcrumbs={[
          { label: 'Finance', to: '/admin/finance/payments' },
          { label: 'Payouts' }
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              onClick={loadPayouts}
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
        searchPlaceholder="Search payout # or vendor..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'pending', label: 'Pending Verification' },
          { value: 'approved', label: 'Approved (Pending Bank Transfer)' },
          { value: 'paid', label: 'Disbursed / Paid' },
          { value: 'rejected', label: 'Rejected' },
        ]}
        onReset={() => { setSearch(''); setStatusFilter('all') }}
      />

      <DataTable
        columns={columns}
        data={payouts}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle="No payout requests found"
        emptyDescription="There are no merchant payout requests matching your filter."
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, payout: null, loading: false })}
        onConfirm={handleConfirmAction}
        loading={dialogState.loading}
        title={
          dialogState.action === 'approve'
            ? `Approve Payout of ${money(dialogState.payout?.amount || 0)}?`
            : dialogState.action === 'reject'
            ? `Reject Payout Request #${dialogState.payout?.payout_number || dialogState.payout?.id}?`
            : `Confirm Bank Transfer Completed for #${dialogState.payout?.payout_number || dialogState.payout?.id}?`
        }
        message={
          dialogState.action === 'approve'
            ? 'Approving marks this withdrawal ready for treasury bank clearance.'
            : dialogState.action === 'reject'
            ? 'Rejecting will refund the requested withdrawal amount back to the vendor wallet available balance.'
            : 'Confirm that bank wire/transfer transaction has been executed.'
        }
        variant={dialogState.action === 'reject' ? 'danger' : 'success'}
        confirmText={
          dialogState.action === 'approve' ? 'Approve Payout' : dialogState.action === 'reject' ? 'Reject Payout' : 'Confirm Disbursed'
        }
        requireReason={dialogState.action === 'reject'}
        reasonPlaceholder="Provide the administrative explanation for rejecting this payout..."
      />
    </div>
  )
}
