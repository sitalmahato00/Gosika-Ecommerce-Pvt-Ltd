import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Wallet, DollarSign, Download, RefreshCw, Search,
  SlidersHorizontal, Plus, Minus,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  CheckCircle2, Clock, XCircle, Store, Landmark, PauseCircle, PlayCircle
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { money, formatDate, formatDateTime, timeAgo } from '../../utils/format'
import { useToast } from '../../context/ToastContext'
import { useBranding } from '../../context/BrandingContext'
import { useAuth } from '../../context/AuthContext'
import { exportReportFromRows, companyFromBranding, personLabel } from '../../utils/reportExport'

const PER_PAGE = 10

const STATUSES = {
  pending: { label: 'Pending', bg: '#fef3c7', fg: '#d97706' },
  processing: { label: 'Processing', bg: '#dbeafe', fg: '#2563eb' },
  eligible: { label: 'Eligible', bg: '#dcfce7', fg: '#16a34a' },
  hold: { label: 'Hold', bg: '#fef3c7', fg: '#d97706' },
  on_hold: { label: 'On Hold', bg: '#fef3c7', fg: '#d97706' },
  paid: { label: 'Paid', bg: '#dcfce7', fg: '#16a34a' },
  approved: { label: 'Approved', bg: '#dcfce7', fg: '#16a34a' },
  rejected: { label: 'Rejected', bg: '#fee2e2', fg: '#dc2626' },
  completed: { label: 'Completed', bg: '#dcfce7', fg: '#16a34a' },
  held: { label: 'Held', bg: '#fef3c7', fg: '#d97706' },
  cancelled: { label: 'Cancelled', bg: '#e5e7eb', fg: '#6b7280' },
  credit_earnings: { label: 'Earnings', bg: '#dcfce7', fg: '#16a34a' },
  credit_settlement: { label: 'Settlement', bg: '#dbeafe', fg: '#2563eb' },
  credit_adjustment: { label: 'Adjustment', bg: '#f3e8ff', fg: '#7c3aed' },
  debit_commission: { label: 'Commission', bg: '#fee2e2', fg: '#dc2626' },
  debit_refund: { label: 'Refund', bg: '#fee2e2', fg: '#dc2626' },
  debit_withdrawal: { label: 'Payout', bg: '#fef3c7', fg: '#d97706' },
  debit_adjustment: { label: 'Adjustment', bg: '#fee2e2', fg: '#dc2626' },
}

function LocalBadge({ status, fallback }) {
  const meta = STATUSES[status] || STATUSES[fallback] || { label: fallback || status, bg: '#f3f4f6', fg: '#6b7280' }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 9px',
        borderRadius: 8,
        background: meta.bg,
        color: meta.fg,
        whiteSpace: 'nowrap',
      }}
    >
      {status === 'paid' || status === 'completed' ? <CheckCircle2 size={11} /> : null}
      {status === 'held' ? <Clock size={11} /> : null}
      {(status === 'rejected' || status === 'cancelled') ? <XCircle size={11} /> : null}
      {meta.label}
    </span>
  )
}

function Pager({ meta, page, onPage, pageName }) {
  if (!meta || meta.last_page <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 14px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
        {pageName} · {meta.total} total · Page {meta.current_page} of {meta.last_page}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          className="btn btn-outline btn-xs"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          ← Prev
        </button>
        <button
          type="button"
          className="btn btn-outline btn-xs"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

export default function AdminVendorFinance() {
  const { id: vendorId } = useParams()
  const { user } = useAuth()
  const branding = useBranding()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [ledger, setLedger] = useState(null)
  const [error, setError] = useState(null)

  const [tab, setTab] = useState('settlements')

  const [orderSearch, setOrderSearch] = useState('')
  const [txnSearch, setTxnSearch] = useState('')
  const [ordersPage, setOrdersPage] = useState(1)
  const [settlementsPage, setSettlementsPage] = useState(1)
  const [payoutsPage, setPayoutsPage] = useState(1)
  const [txnPage, setTxnPage] = useState(1)

  const [expandedOrders, setExpandedOrders] = useState(new Set())

  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustType, setAdjustType] = useState('credit')
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [saving, setSaving] = useState(false)

  const [dialogState, setDialogState] = useState({
    isOpen: false,
    action: null, // 'hold' | 'release' | 'distribute'
    settlement: null,
    loading: false,
  })

  const loadLedger = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        orders_per_page: PER_PAGE,
        orders_page: ordersPage,
        order_search: orderSearch.trim() || undefined,
        settlements_per_page: PER_PAGE,
        settlements_page: settlementsPage,
        payouts_per_page: PER_PAGE,
        payouts_page: payoutsPage,
        txn_per_page: PER_PAGE,
        txn_page: txnPage,
        txn_search: txnSearch.trim() || undefined,
      }
      const res = await api.get(`/admin/wallet/vendors/${vendorId}/ledger`, { params })
      setLedger(res.data?.data || res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vendor finance data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { setOrdersPage(1) }, [orderSearch])
  useEffect(() => { setTxnPage(1) }, [txnSearch])

  useEffect(() => {
    if (!vendorId) return
    const t = setTimeout(() => loadLedger(), 350)
    return () => clearTimeout(t)
  }, [vendorId, ordersPage, settlementsPage, payoutsPage, txnPage, orderSearch, txnSearch])

  const handleAdjust = async (e) => {
    e.preventDefault()
    const amountVal = Number(adjustAmount)
    if (!amountVal || Number.isNaN(amountVal)) {
      toast.error('Please enter a valid amount.')
      return
    }

    setSaving(true)
    try {
      const signed = adjustType === 'credit' ? Math.abs(amountVal) : -Math.abs(amountVal)
      await api.post(`/admin/wallet/vendors/${vendorId}/wallet/adjust`, {
        amount: signed,
        reason: adjustReason || 'Administrative ledger adjustment',
      })
      toast.success('Wallet balance adjusted.')
      setAdjustOpen(false)
      setAdjustAmount('')
      setAdjustReason('')
      loadLedger()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed.')
    } finally {
      setSaving(false)
    }
  }

  const toggleOrder = (id) => {
    setExpandedOrders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSettlementAction = (action, settlement) => {
    setDialogState({ isOpen: true, action, settlement, loading: false })
  }

  const handleSettlementConfirm = async (reason) => {
    const { action, settlement } = dialogState
    if (!settlement) return

    setDialogState(prev => ({ ...prev, loading: true }))
    const targetId = settlement.id || settlement.uuid

    try {
      if (action === 'hold') {
        await api.post(`/admin/wallet/settlements/${targetId}/hold`, { reason })
        toast.success(`Settlement #${settlement.settlement_number || ''} placed on hold.`)
      } else if (action === 'release') {
        await api.post(`/admin/wallet/settlements/${targetId}/release`)
        toast.success(`Settlement #${settlement.settlement_number || ''} released from hold.`)
      } else if (action === 'distribute') {
        await api.post(`/admin/wallet/settlements/${targetId}/distribute`)
        toast.success(`Settlement #${settlement.settlement_number || ''} distributed.`)
      }

      setDialogState({ isOpen: false, action: null, settlement: null, loading: false })
      loadLedger()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settlement operation failed.')
      setDialogState(prev => ({ ...prev, loading: false }))
    }
  }

  const txnDirection = (t) => (t.transaction_type || '').startsWith('debit_') ? 'debit' : 'credit'
  const txnReference = (t) => {
    if (!t.reference_type) return t.id
    return `${String(t.reference_type).replace(/_/g, ' ')} #${t.reference_id ?? ''}`
  }

  const exportTransactions = () => {
    const txns = ledger?.transactions || []
    exportReportFromRows({
      columns: [
        { label: 'Reference' },
        { label: 'Type' },
        { label: 'Direction' },
        { label: 'Amount', align: 'right' },
        { label: 'Balance After', align: 'right' },
        { label: 'Description' },
        { label: 'Date' },
      ],
      rows: txns.map(t => [
        txnReference(t),
        (t.transaction_type || '').replace('_', ' '),
        txnDirection(t),
        t.amount || 0,
        t.balance_after || '',
        t.description || '',
        formatDateTime(t.created_at),
      ]),
      title: `Wallet Transactions — ${ledger?.vendor?.company_name || 'Vendor'}`,
      subtitle: 'Individual wallet credit and debit entries for this vendor account, including earnings and settlement distributions.',
      sectionLabel: 'Wallet Transaction Ledger',
      fileName: `gosika_wallet_txns_${vendorId?.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Wallet transactions exported.')
  }

  const exportOrders = () => {
    const rows = (ledger?.orders || []).filter(o =>
      !orderSearch.trim() ||
      (o.vendor_order_number || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.order_number || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.items || []).some(it => (it.product_name || '').toLowerCase().includes(orderSearch.toLowerCase()))
    )
    exportReportFromRows({
      columns: [
        { label: 'Vendor Order #' },
        { label: 'Store Order #' },
        { label: 'Date' },
        { label: 'Status' },
        { label: 'Gross Total', align: 'right' },
        { label: 'Commission', align: 'right' },
        { label: 'Vendor Payable', align: 'right' },
        { label: 'Product' },
        { label: 'Product Line Total', align: 'right' },
      ],
      rows: rows.flatMap(o =>
        (o.items || []).map(it => [
          o.vendor_order_number || '',
          o.order_number || '',
          o.placed_at ? new Date(o.placed_at).toLocaleDateString() : '',
          o.status || '',
          it === (o.items || [])[0] ? (o.grand_total || 0) : '',
          it === (o.items || [])[0] ? (o.commission_amount || 0) : '',
          it === (o.items || [])[0] ? (o.vendor_payable || 0) : '',
          it.product_name || '',
          it.line_total || 0,
        ])
      ),
      title: `Vendor Orders — ${ledger?.vendor?.company_name || 'Vendor'}`,
      subtitle: 'Order-level and product-level line items with commission and vendor payable.',
      sectionLabel: 'Orders Ledger',
      fileName: `gosika_orders_${vendorId?.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}`,
      preparedBy: personLabel(user),
      company: companyFromBranding(branding),
    })
    toast.success('Orders exported.')
  }

  if (loading && !ledger) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
        <RefreshCw size={24} className="spin" style={{ color: 'var(--primary)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontWeight: 700 }}>{error}</p>
        <button className="btn btn-outline btn-sm" onClick={loadLedger} style={{ marginTop: 12 }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  const vendor = ledger?.vendor || {}
  const wallet = ledger?.wallet || {}
  const stats = ledger?.stats || {}
  const orders = ledger?.orders || []
  const settlements = ledger?.settlements || []
  const payouts = ledger?.payouts || []
  const transactions = ledger?.transactions || []
  const bankAccounts = ledger?.bank_accounts || []

  const ordersTotal = ledger?.orders_pagination?.total ?? orders.length
  const settlementsTotal = ledger?.settlements_pagination?.total ?? settlements.length
  const payoutsTotal = ledger?.payouts_pagination?.total ?? payouts.length
  const txnsTotal = ledger?.transactions_pagination?.total ?? transactions.length

  const settlementColor = (status) => {
    if (status === 'paid') return '#16a34a'
    if (status === 'hold' || status === 'eligible') return '#d97706'
    return '#2563eb'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={vendor.company_name || 'Vendor Finance'}
        description={`Full financial ledger for ${vendor.company_name || 'vendor'} — wallet balance, orders, settlements you can hold/release/distribute, payouts and every transaction.`}
        breadcrumbs={[
          { label: 'Finance', to: '/admin/finance/payments' },
          { label: 'Settlements', to: '/admin/finance/settlements' },
          { label: vendor.company_name || 'Vendor Wallet' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setAdjustOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <SlidersHorizontal size={14} /> Adjust Balance
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={loadLedger}
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      {/* Wallet summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid var(--primary, #2563eb)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted, #6b7280)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            <Wallet size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Total Balance
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink, #111827)' }}>{money(wallet.balance || 0)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{wallet.currency || 'NPR'}</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            <TrendingUp size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Available
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#16a34a' }}>{money(wallet.available_balance || 0)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Ready for payout</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Pending
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#d97706' }}>{money(wallet.pending_balance || 0)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Awaiting payout request</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            <TrendingDown size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Commission Deducted
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed' }}>{money(stats.total_commission || 0)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>From {stats.orders_count || 0} orders</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #0891b2' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            <CheckCircle2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Settled to Date
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0891b2' }}>{money(stats.total_settled || 0)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Vendor eligible funds</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
            <DollarSign size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Withdrawn
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#2563eb' }}>{money(stats.total_withdrawn || 0)}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Payouts disbursed</div>
        </div>
      </div>

      {/* Vendor info bar */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', fontSize: 12.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', color: 'var(--primary, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={16} />
          </div>
          <div>
            <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{vendor.company_name}</span>
            <span style={{ marginLeft: 8, color: 'var(--muted)' }}>PAN: {vendor.pan_vat || '—'}</span>
          </div>
        </div>
        <span style={{ color: 'var(--muted)' }}>Email: {vendor.business_email}</span>
        <LocalBadge status={vendor.status} fallback="active" />
      </div>

      {/* Bank accounts (always visible) */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Landmark size={14} style={{ color: '#0891b2' }} /> Store Bank Accounts
          </h4>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
            Settlement amounts are distributed to these accounts
          </span>
        </div>
        {bankAccounts.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--muted)', padding: 14, textAlign: 'center' }}>No bank accounts registered for this store.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Bank / Branch</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Account Name</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Account Number</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Type</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)' }}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {bankAccounts.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#e0f2fe', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Landmark size={14} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{b.bank_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{b.branch_name || '—'} branch</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--ink)' }}>{b.account_name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.5 }}>{b.account_number}</span>
                    </td>
                    <td style={{ padding: '10px 14px', textTransform: 'capitalize', color: 'var(--muted)' }}>{b.account_type}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {b.is_default && <span style={{ fontSize: 10, fontWeight: 800, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6 }}>DEFAULT</span>}
                        {b.is_verified && <span style={{ fontSize: 10, fontWeight: 800, background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: 6 }}>VERIFIED</span>}
                        {!b.is_default && !b.is_verified && <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border, #e5e7eb)' }}>
        {[
          { key: 'orders', label: `Orders (${ordersTotal})` },
          { key: 'settlements', label: `Settlements & Payouts (${settlementsTotal + payoutsTotal})` },
          { key: 'transactions', label: `Transactions (${txnsTotal})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 700,
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--primary, #2563eb)' : '2px solid transparent',
              color: tab === t.key ? 'var(--primary, #2563eb)' : 'var(--muted, #6b7280)',
              cursor: 'pointer',
              marginBottom: -2,
            }}
          >
            {t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: 4 }}>
          <button
            className="btn btn-outline btn-xs"
            onClick={tab === 'transactions' ? exportTransactions : (tab === 'orders' ? exportOrders : exportTransactions)}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Download size={12} /> Export {tab === 'transactions' ? 'Txns' : tab === 'orders' ? 'Orders' : 'Txns'}
          </button>
        </div>
      </div>

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                className="input"
                style={{ width: '100%', paddingLeft: 32, height: 36, fontSize: 13 }}
                placeholder="Search vendor order #, order #, product name..."
                value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Vendor Order</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Store Order</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Date</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Settlement Period</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Gross Total</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Commission</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Vendor Payable</th>
                    <th style={{ padding: '10px 14px', width: 36 }} />
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>No orders found.</td>
                    </tr>
                  )}
                  {orders.map(o => {
                    const expanded = expandedOrders.has(o.id)
                    return (
                      <React.Fragment key={o.id}>
                        <tr
                          style={{ borderBottom: expanded ? 'none' : '1px solid var(--border)', cursor: 'pointer' }}
                          onClick={() => toggleOrder(o.id)}
                        >
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {expanded ? <ChevronUp size={13} color="var(--muted)" /> : <ChevronDown size={13} color="var(--muted)" />}
                              #{o.vendor_order_number}
                            </div>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--ink)' }}>#{o.order_number}</td>
                          <td style={{ padding: '10px 14px', color: 'var(--muted)' }}>{o.placed_at ? new Date(o.placed_at).toLocaleDateString() : '—'}</td>
                          <td style={{ padding: '10px 14px' }}><LocalBadge status={o.status} /></td>
                          <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                            {o.settlement ? (
                              <>
                                <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{o.settlement.number}</div>
                                <div>{formatDate(o.settlement.period_start)} → {formatDate(o.settlement.period_end)}</div>
                                <div style={{ fontWeight: 700, color: settlementColor(o.settlement.status) }}>
                                  {o.settlement.status}
                                  {o.settlement.status === 'hold' && o.settlement.hold_reason ? ' • on hold' : ''}
                                </div>
                              </>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>Not yet settled</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>{money(o.grand_total)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>- {money(o.commission_amount)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{money(o.vendor_payable)}</td>
                          <td style={{ padding: '10px 14px' }} />
                        </tr>
                        {expanded && o.items?.length > 0 && (
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan={9} style={{ padding: '0 14px 12px 36px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)' }}>Product</th>
                                    <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: 'var(--muted)' }}>SKU</th>
                                    <th style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--muted)' }}>Qty</th>
                                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)' }}>Unit Price</th>
                                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)' }}>Discount</th>
                                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)' }}>Line Total</th>
                                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)' }}>Commission</th>
                                    <th style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--muted)' }}>Vendor Payable</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {o.items.map((it, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                      <td style={{ padding: '5px 10px', fontWeight: 600, color: 'var(--ink)' }}>{it.product_name}</td>
                                      <td style={{ padding: '5px 10px', color: 'var(--muted)', fontFamily: 'monospace', fontSize: 11 }}>{it.sku || '—'}</td>
                                      <td style={{ padding: '5px 10px', textAlign: 'center' }}>{it.quantity}</td>
                                      <td style={{ padding: '5px 10px', textAlign: 'right' }}>{money(it.unit_price)}</td>
                                      <td style={{ padding: '5px 10px', textAlign: 'right', color: '#dc2626' }}>{Number(it.unit_discount) > 0 ? `- ${money(it.unit_discount)}` : '—'}</td>
                                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>{money(it.line_total)}</td>
                                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>- {money(it.line_commission || 0)}</td>
                                      <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{money(it.line_vendor_payable || it.line_total)}</td>
                                    </tr>
                                  ))}
                                  <tr style={{ background: '#eff6ff' }}>
                                    <td colSpan={5} style={{ padding: '5px 10px', fontWeight: 700, color: 'var(--primary)', fontSize: 11 }}>Order commission ({o.commission_rate}% on items subtotal)</td>
                                    <td colSpan={2} style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700, color: '#dc2626', fontSize: 11 }}>
                                      - {money(o.commission_amount)} ({o.commission_rate}%)
                                    </td>
                                    <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 800, color: '#16a34a', fontSize: 11 }}>{money(o.vendor_payable)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pager meta={ledger?.orders_pagination} page={ordersPage} onPage={setOrdersPage} pageName="Orders" />
          </div>
        </div>
      )}

      {/* SETTLEMENTS & PAYOUTS TAB */}
      {tab === 'settlements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Settlements */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={14} style={{ color: '#16a34a' }} /> Settlement Cycles
              </h4>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
                Eligible &amp; processing settlements can be distributed here
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Settlement #</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Period</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Gross / Commission</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Net Payable</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>No settlement cycles for this store.</td>
                    </tr>
                  )}
                  {settlements.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        #{s.settlement_number || s.id}
                        <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 400 }}>{timeAgo(s.generated_at || s.created_at)}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                        {formatDate(s.period_start)} → {formatDate(s.period_end)}
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.orders_count || 0} order(s)</div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 11.5 }}>
                        <div style={{ fontWeight: 700 }}>{money(s.gross_sales)}</div>
                        <div style={{ color: '#dc2626' }}>- {money(s.commission_total)}</div>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>{money(s.net_payable)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <LocalBadge status={s.status} />
                        {s.status === 'hold' && s.hold_reason && (
                          <div style={{ fontSize: 10.5, color: '#b45309', maxWidth: 220, marginTop: 3 }}>Hold: {s.hold_reason}</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {(s.status === 'eligible' || s.status === 'processing') && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              style={{ color: '#d97706', borderColor: '#fcd34d' }}
                              onClick={() => handleSettlementAction('hold', s)}
                              title="Place settlement on hold"
                            >
                              <PauseCircle size={12} style={{ marginRight: 3 }} /> Hold
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              style={{ color: '#16a34a', borderColor: '#86efac' }}
                              onClick={() => handleSettlementAction('distribute', s)}
                              title={s.status === 'processing' ? 'Mark the accepted payout and this settlement as distributed / paid' : 'Distribute net payable to the store and mark settlement paid'}
                            >
                              <CheckCircle2 size={12} style={{ marginRight: 3 }} /> Distribute
                            </button>
                          </div>
                        )}
                        {s.status === 'hold' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => handleSettlementAction('release', s)}
                            title="Release from hold back to eligible"
                          >
                            <PlayCircle size={12} style={{ marginRight: 3 }} /> Release
                          </button>
                        )}
                        {s.status === 'paid' && s.paid_at && (
                          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                            Paid {formatDateTime(s.paid_at)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager meta={ledger?.settlements_pagination} page={settlementsPage} onPage={setSettlementsPage} pageName="Settlements" />
          </div>

          {/* Payouts */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={14} style={{ color: '#2563eb' }} /> Payout Requests
              </h4>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
                {payoutsTotal} total payout request(s)
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Payout #</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Settlement</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Bank</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)' }}>Amount</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Status</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>No payout requests for this store.</td>
                    </tr>
                  )}
                  {payouts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        #{p.payout_number}
                        <div style={{ fontSize: 10.5, color: 'var(--muted)', fontWeight: 400 }}>{timeAgo(p.requested_at)}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11.5, color: 'var(--muted)' }}>
                        {p.settlement?.settlement_number ? `#${p.settlement.settlement_number}` : '—'}
                        {p.settlement?.status ? <div><LocalBadge status={p.settlement.status} fallback="paid" /></div> : null}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11.5, color: 'var(--muted)' }}>
                        {p.bank_account?.bank_name ? (
                          <>
                            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{p.bank_account.bank_name}</div>
                            <div>{p.bank_account.account_name} · {p.bank_account.account_number}</div>
                          </>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#2563eb' }}>{money(p.amount)}</td>
                      <td style={{ padding: '10px 14px' }}><LocalBadge status={p.status} /></td>
                      <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 11.5, whiteSpace: 'nowrap' }}>
                        {p.paid_at ? formatDateTime(p.paid_at) : formatDateTime(p.requested_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager meta={ledger?.payouts_pagination} page={payoutsPage} onPage={setPayoutsPage} pageName="Payouts" />
          </div>
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {tab === 'transactions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                className="input"
                style={{ width: '100%', paddingLeft: 32, height: 36, fontSize: 13 }}
                placeholder="Search transaction description, type or reference..."
                value={txnSearch}
                onChange={e => setTxnSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Reference</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Type</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Direction</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)' }}>Amount</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--muted)' }}>Balance After</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Description</th>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--muted)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>No transactions found.</td>
                    </tr>
                  )}
                  {transactions.map(t => {
                    const direction = txnDirection(t)
                    const credit = direction === 'credit'
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, fontWeight: 700 }}>{txnReference(t)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <LocalBadge status={t.transaction_type} fallback={t.transaction_type} />
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: credit ? '#dcfce7' : '#fee2e2',
                            color: credit ? '#16a34a' : '#dc2626',
                          }}>
                            {credit ? '↑ CREDIT' : '↓ DEBIT'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: credit ? '#16a34a' : '#dc2626', fontSize: 13.5 }}>
                          {credit ? '+' : '-'} {money(t.amount)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>{money(t.balance_after || 0)}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 11.5, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{t.created_at ? formatDateTime(t.created_at) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pager meta={ledger?.transactions_pagination} page={txnPage} onPage={setTxnPage} pageName="Transactions" />
          </div>
        </div>
      )}

      {/* ADJUST MODAL */}
      {adjustOpen && (
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
            padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) setAdjustOpen(false) }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 460,
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Adjust Wallet Ledger
              </h3>
              <button className="btn btn-ghost btn-xs" onClick={() => setAdjustOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                Manually credit or debit the wallet of <strong>{vendor.company_name}</strong>.
              </p>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Adjustment Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${adjustType === 'credit' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setAdjustType('credit')}
                    style={{ justifyContent: 'center' }}
                  >
                    <Plus size={14} style={{ marginRight: 4 }} /> Credit (Add Funds)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${adjustType === 'debit' ? 'btn-danger' : 'btn-outline'}`}
                    onClick={() => setAdjustType('debit')}
                    style={{ justifyContent: 'center' }}
                  >
                    <Minus size={14} style={{ marginRight: 4 }} /> Debit (Deduct Funds)
                  </button>
                </div>
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Amount (NPR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="input"
                  style={{ width: '100%', height: 38, fontSize: 14, fontWeight: 700 }}
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                />
              </div>

              <div>
                <label className="label" style={{ fontSize: 12, fontWeight: 700 }}>Audit Reason *</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Manual correction for return dispute resolution."
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAdjustOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Processing...' : 'Apply Ledger Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState({ isOpen: false, action: null, settlement: null, loading: false })}
        onConfirm={handleSettlementConfirm}
        loading={dialogState.loading}
        title={
          dialogState.action === 'distribute'
            ? `Distribute Settlement #${dialogState.settlement?.settlement_number || dialogState.settlement?.id}?`
            : dialogState.action === 'hold'
              ? `Hold Settlement #${dialogState.settlement?.settlement_number || dialogState.settlement?.id}?`
              : `Release Settlement #${dialogState.settlement?.settlement_number || dialogState.settlement?.id}?`
        }
        message={
          dialogState.action === 'distribute'
            ? dialogState.settlement?.status === 'processing'
              ? 'This marks the accepted payout request and the settlement as distributed / paid to the store bank account.'
              : 'This moves the net payable to the store\'s available balance and marks the settlement as distributed / paid. Only allowed when no active payout exists.'
            : dialogState.action === 'hold'
              ? 'Holding keeps the funds pending until released. Please provide a reason for the hold.'
              : 'Releasing returns this settlement to eligible so the vendor can request a payout for it.'
        }
        variant={dialogState.action === 'distribute' ? 'success' : (dialogState.action === 'hold' ? 'warning' : 'primary')}
        confirmText={dialogState.action === 'distribute' ? 'Distribute' : (dialogState.action === 'hold' ? 'Place on Hold' : 'Release')}
        requireReason={dialogState.action === 'hold'}
        reasonPlaceholder="Specify reason for placing this settlement on hold..."
      />
    </div>
  )
}