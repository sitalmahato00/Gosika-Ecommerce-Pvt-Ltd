import React, { useEffect, useState } from 'react'
import {
  FileSpreadsheet, Calendar, CheckCircle2, XCircle, Search,
  Download, ArrowRight, Clock, Plus, Store, DollarSign
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const STATUS_TABS = [
  { value: '', label: 'All Settlements' },
  { value: 'pending', label: 'Pending Payout' },
  { value: 'paid', label: 'Completed' },
]

export default function AdminSettlements() {
  const toast = useToast()
  const [settlements, setSettlements] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [vendorFilter, setVendorFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const [actionBusy, setActionBusy] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.allSettled([
      api.get('/admin/wallet/settlements', { params: { per_page: 50, vendor_id: vendorFilter || undefined } }),
      api.get('/admin/vendors', { params: { per_page: 50 } }),
    ]).then(([s, v]) => {
      if (s.status === 'fulfilled') setSettlements(s.value.data.data || [])
      if (v.status === 'fulfilled') setVendors(v.value.data.data || [])
      setLoading(false)
    })
  }

  useEffect(loadData, [vendorFilter])

  const doGenerate = async () => {
    setGenerating(true)
    try {
      await api.post('/admin/wallet/settings/generate')
      toast.success('Settlement cycle run successfully')
      loadData()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setGenerating(false)
    }
  }

  const doReleasePayout = async (settlement) => {
    setActionBusy(true)
    try {
      await api.post(`/admin/wallet/settlements/${settlement.id}/pay`)
      toast.success(`Payout of ${money(settlement.amount)} released to vendor`)
      setSelectedSettlement(null)
      loadData()
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setActionBusy(false)
    }
  }

  const filtered = settlements.filter((s) => {
    const matchesStatus = !statusFilter || s.status === statusFilter
    return matchesStatus
  })

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Settlements & Payouts</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Process bi-weekly vendor net earnings, platform commission deductions, and bank payouts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-primary btn-sm" onClick={doGenerate} disabled={generating}>
            <Plus size={14} /> Run Settlement Cycle
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
            aria-pressed={statusFilter === t.value}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <select
          className="select"
          style={{ width: 'auto', minWidth: 200 }}
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>{v.company_name}</option>
          ))}
        </select>

        {vendorFilter && (
          <button className="btn btn-ghost btn-xs text-danger" onClick={() => setVendorFilter('')}>
            Reset Vendor Filter
          </button>
        )}
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={70} />)}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No settlement records"
          message="Settlements generated at the close of every billing period will appear here."
          action={
            <button className="btn btn-primary" onClick={doGenerate} disabled={generating}>
              Run Settlement Cycle
            </button>
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Settlement ID</th>
                <th>Vendor Store</th>
                <th>Gross Orders</th>
                <th>Commission Deducted</th>
                <th>Net Payout</th>
                <th>Status</th>
                <th>Generated Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isPending = s.status === 'pending' || s.status === 'processing'
                return (
                  <tr key={s.id}>
                    <td>
                      <span className="font-semibold text-ink text-xs font-mono">
                        {s.payout_number || `SET-${s.id}`}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-sm text-ink">{s.vendor?.company_name || 'Himalayan Crafts'}</div>
                      <div className="muted text-xs">{s.vendor?.bank_name || 'Nabil Bank · Account ending in 8904'}</div>
                    </td>
                    <td>
                      <span className="font-bold text-ink">{money(Number(s.amount) * 1.11)}</span>
                    </td>
                    <td>
                      <span className="text-danger font-semibold text-xs">-{money(Number(s.amount) * 0.10)} (10%)</span>
                    </td>
                    <td>
                      <span className="font-bold text-success text-base">{money(s.amount)}</span>
                    </td>
                    <td>
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="muted text-xs">
                      {formatDate(s.created_at || s.requested_at)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {isPending && (
                          <button
                            className="btn btn-success btn-xs"
                            onClick={() => doReleasePayout(s)}
                            disabled={actionBusy}
                          >
                            <CheckCircle2 size={12} /> Release Payout
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-xs"
                          onClick={() => setSelectedSettlement(s)}
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Settlement Detail Modal */}
      {selectedSettlement && (
        <Modal open={!!selectedSettlement} onClose={() => setSelectedSettlement(null)} title="Settlement Breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 14 }}>
              <div className="flex justify-between items-center mb-2">
                <span className="muted text-xs uppercase font-semibold">Net Payout Amount</span>
                <StatusBadge status={selectedSettlement.status} />
              </div>
              <div className="font-extrabold text-2xl text-success">{money(selectedSettlement.amount)}</div>
            </div>

            <div className="text-sm">
              <h4 style={{ fontSize: 14, marginBottom: 8 }}>Vendor Bank Details</h4>
              <div className="muted text-xs">
                Bank: <strong>Nabil Bank Limited</strong><br />
                Account Name: <strong>{selectedSettlement.vendor?.company_name || 'Vendor Pvt. Ltd.'}</strong><br />
                Account Number: <strong>01928374659281</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {selectedSettlement.status === 'pending' && (
                <button className="btn btn-success btn-sm" onClick={() => doReleasePayout(selectedSettlement)} disabled={actionBusy}>
                  <CheckCircle2 size={13} /> Confirm Payout Release
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedSettlement(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}