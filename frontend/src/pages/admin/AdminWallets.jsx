import React, { useEffect, useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Calendar, Check, XCircle,
  AlertCircle, Clock, Plus, Search, ShieldCheck, DollarSign, Download,
  Layers, RefreshCw, SlidersHorizontal, Eye
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { money, formatDate, formatDateTime, errorMessage } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const SAMPLE_VENDOR_WALLETS = [
  {
    id: 'WLT-101',
    vendor_id: 1,
    vendor_name: 'Koshi Handicrafts & Weaving',
    owner: 'Suman Shrestha',
    available_balance: 145000,
    escrow_balance: 24000,
    total_sales: 185000,
    last_payout: '2026-08-10',
    status: 'active',
  },
  {
    id: 'WLT-102',
    vendor_id: 2,
    vendor_name: 'Kathmandu Electronics & Tech',
    owner: 'Pradeep Adhikari',
    available_balance: 285000,
    escrow_balance: 57000,
    total_sales: 342000,
    last_payout: '2026-08-12',
    status: 'active',
  },
  {
    id: 'WLT-103',
    vendor_id: 3,
    vendor_name: 'Everest Pashmina & Woolens',
    owner: 'Dawa Sherpa',
    available_balance: 215000,
    escrow_balance: 38000,
    total_sales: 275000,
    last_payout: '2026-08-08',
    status: 'active',
  },
  {
    id: 'WLT-104',
    vendor_id: 4,
    vendor_name: 'Pokhara Trekking & Outdoor Hub',
    owner: 'Bikram Thapa',
    available_balance: 260000,
    escrow_balance: 42000,
    total_sales: 310000,
    last_payout: '2026-08-05',
    status: 'active',
  },
  {
    id: 'WLT-105',
    vendor_id: 5,
    vendor_name: 'Himalayan Organic Teas & Herbs',
    owner: 'Maya Gurung',
    available_balance: 78000,
    escrow_balance: 14000,
    total_sales: 98000,
    last_payout: '2026-07-28',
    status: 'active',
  },
]

const SAMPLE_TRANSACTIONS = [
  { id: 'TX-8019', vendor: 'Kathmandu Electronics', type: 'order_settlement', description: 'Order #ORD-8942 escrow release after 7-day window', amount: 4050, balance_after: 285000, date: '2026-08-15 11:30' },
  { id: 'TX-8018', vendor: 'Koshi Handicrafts', type: 'commission_deduction', description: 'Platform 10% commission on #ORD-8940', amount: -450, balance_after: 145000, date: '2026-08-15 10:15' },
  { id: 'TX-8017', vendor: 'Everest Pashmina', type: 'payout_withdrawal', description: 'Settlement cycle #SET-9014 bank disbursement', amount: -85000, balance_after: 215000, date: '2026-08-14 16:40' },
  { id: 'TX-8016', vendor: 'Pokhara Trekking', type: 'order_settlement', description: 'Order #ORD-8938 escrow release', amount: 8010, balance_after: 260000, date: '2026-08-14 14:20' },
  { id: 'TX-8015', vendor: 'Himalayan Organic Teas', type: 'manual_adjustment', description: 'Promo bonus credit by Admin', amount: 1500, balance_after: 78000, date: '2026-08-13 09:00' },
]

export default function AdminWallets() {
  const toast = useToast()
  const [wallets, setWallets] = useState(SAMPLE_VENDOR_WALLETS)
  const [transactions, setTransactions] = useState(SAMPLE_TRANSACTIONS)
  const [search, setSearch] = useState('')
  const [selectedWallet, setSelectedWallet] = useState(null)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ vendor_id: '', type: 'credit', amount: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const exportCSV = () => {
    const rows = [
      ['Wallet ID', 'Vendor Store', 'Owner', 'Available Balance (NPR)', 'In Escrow (NPR)', 'Total Sales (NPR)', 'Last Payout'],
      ...wallets.map((w) => [
        w.id, w.vendor_name, w.owner, w.available_balance, w.escrow_balance, w.total_sales, w.last_payout
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_vendor_wallets_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Wallet ledger exported to CSV')
  }

  const totals = useMemo(() => {
    const available = wallets.reduce((sum, w) => sum + w.available_balance, 0)
    const escrow = wallets.reduce((sum, w) => sum + w.escrow_balance, 0)
    const totalGmv = wallets.reduce((sum, w) => sum + w.total_sales, 0)
    const commissions = totalGmv * 0.1
    return { available, escrow, totalGmv, commissions }
  }, [wallets])

  const handleAdjust = (e) => {
    e.preventDefault()
    setSaving(true)
    const amountVal = Number(adjustForm.amount)
    if (isNaN(amountVal) || amountVal <= 0) {
      toast.error('Please enter a valid amount')
      setSaving(false)
      return
    }

    const delta = adjustForm.type === 'credit' ? amountVal : -amountVal
    const target = wallets.find(w => w.id === adjustForm.vendor_id || w.vendor_name === adjustForm.vendor_id)
    if (target) {
      const updatedWallets = wallets.map(w => w.id === target.id ? { ...w, available_balance: Math.max(0, w.available_balance + delta) } : w)
      setWallets(updatedWallets)

      const newTx = {
        id: `TX-${8020 + transactions.length}`,
        vendor: target.vendor_name,
        type: 'manual_adjustment',
        description: `Admin manual adjustment: ${adjustForm.reason || 'Balance reconciliation'}`,
        amount: delta,
        balance_after: Math.max(0, target.available_balance + delta),
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      }
      setTransactions([newTx, ...transactions])
      toast.success(`Wallet balance for ${target.vendor_name} adjusted by ${money(amountVal)}`)
    }

    setSaving(false)
    setAdjustModalOpen(false)
    setAdjustForm({ vendor_id: '', type: 'credit', amount: '', reason: '' })
  }

  const filteredWallets = wallets.filter(w =>
    w.vendor_name.toLowerCase().includes(search.toLowerCase()) ||
    w.owner.toLowerCase().includes(search.toLowerCase()) ||
    w.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Vendor Wallets & Financial Ledger</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor vendor available balances, escrow funds (7-day return window), and platform financial ledger.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setAdjustForm({ vendor_id: wallets[0]?.id || '', type: 'credit', amount: '', reason: '' })
              setAdjustModalOpen(true)
            }}
          >
            <SlidersHorizontal size={14} /> Adjust Balance
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Available Payouts</span>
            <Wallet size={16} color="var(--success)" />
          </div>
          <div className="font-extrabold text-2xl mt-1 text-success">{money(totals.available)}</div>
          <span className="muted text-xs mt-1 block">Ready for settlement release</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">In Escrow (Return Window)</span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div className="font-extrabold text-2xl mt-1 text-warning">{money(totals.escrow)}</div>
          <span className="muted text-xs mt-1 block">7-day hold on recent orders</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Total Vendor GMV</span>
            <DollarSign size={16} color="var(--primary)" />
          </div>
          <div className="font-extrabold text-2xl mt-1 text-ink">{money(totals.totalGmv)}</div>
          <span className="muted text-xs mt-1 block">Lifetime seller volume</span>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="flex items-center justify-between">
            <span className="muted text-xs uppercase font-bold">Platform Commissions</span>
            <ShieldCheck size={16} color="#7c3aed" />
          </div>
          <div className="font-extrabold text-2xl mt-1" style={{ color: '#7c3aed' }}>{money(totals.commissions)}</div>
          <span className="muted text-xs mt-1 block">10% standard marketplace fee</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search vendor store or wallet ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-sm">{filteredWallets.length} vendor wallet{filteredWallets.length !== 1 ? 's' : ''} listed</span>
      </div>

      {/* Vendor Wallets Table */}
      <div className="table-wrap mb-4">
        <table className="table">
          <thead>
            <tr>
              <th>Vendor Store</th>
              <th>Owner</th>
              <th>Available Balance</th>
              <th>In Escrow</th>
              <th>Lifetime GMV</th>
              <th>Last Payout</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWallets.map((w) => (
              <tr key={w.id}>
                <td>
                  <div className="font-bold text-sm text-ink">{w.vendor_name}</div>
                  <div className="muted text-xs font-mono">{w.id}</div>
                </td>
                <td className="text-sm font-medium">{w.owner}</td>
                <td>
                  <span className="font-bold text-success text-sm">{money(w.available_balance)}</span>
                </td>
                <td>
                  <span className="font-medium text-warning text-sm">{money(w.escrow_balance)}</span>
                </td>
                <td>
                  <span className="font-bold text-ink text-sm">{money(w.total_sales)}</span>
                </td>
                <td className="muted text-xs font-mono">{formatDate(w.last_payout)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => {
                      setAdjustForm({ vendor_id: w.id, type: 'credit', amount: '', reason: '' })
                      setAdjustModalOpen(true)
                    }}
                  >
                    <SlidersHorizontal size={12} /> Adjust
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Ledger Activity */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
          <Layers size={16} color="var(--primary)" /> Recent Immutable Ledger Activity
        </h3>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Vendor</th>
                <th>Description</th>
                <th>Amount (NPR)</th>
                <th>Balance After</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const isCredit = t.amount > 0
                return (
                  <tr key={t.id}>
                    <td>
                      <span className="font-mono text-xs font-bold text-ink">{t.id}</span>
                    </td>
                    <td className="font-semibold text-sm text-ink">{t.vendor}</td>
                    <td className="muted text-xs" style={{ maxWidth: 300 }}>
                      {t.description}
                    </td>
                    <td>
                      <span className={`font-bold text-sm ${isCredit ? 'text-success' : 'text-danger'}`}>
                        {isCredit ? '+' : ''}{money(t.amount)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-semibold">{money(t.balance_after)}</span>
                    </td>
                    <td className="muted text-xs font-mono">{t.date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {adjustModalOpen && (
        <Modal open={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title="Manual Wallet Balance Adjustment">
          <form onSubmit={handleAdjust} className="flex flex-col gap-3">
            <div className="form-group">
              <label className="label">Select Vendor Store</label>
              <select
                className="select"
                required
                value={adjustForm.vendor_id}
                onChange={(e) => setAdjustForm({ ...adjustForm, vendor_id: e.target.value })}
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.vendor_name} (Current: {money(w.available_balance)})</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Adjustment Type</label>
                <select
                  className="select"
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                >
                  <option value="credit">Credit Balance (+ Add Funds)</option>
                  <option value="debit">Debit Balance (- Deduct Funds)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Amount (NPR) <span className="req">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  className="input"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Reason / Justification <span className="req">*</span></label>
              <textarea
                className="textarea"
                rows={2}
                required
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="e.g. Bonus incentive for top sales, fee correction, or refund reconciliation."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setAdjustModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? 'Adjusting…' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}