import React, { useState, useEffect } from 'react'
import {
  Wallet, RefreshCw, ArrowDownLeft, ArrowUpRight, Eye
} from 'lucide-react'
import api from '../../api/client'
import PageHeader from '../../components/admin/PageHeader'
import DataTable from '../../components/admin/DataTable'
import KpiCard from '../../components/admin/KpiCard'
import StatusBadge from '../../components/commerce/StatusBadge'
import { money, formatDateTime, timeAgo, initials } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const TRANSACTION_LABEL = {
  cashback_reward: 'Cashback Reward',
  refund_credit: 'Refund Credit',
  top_up: 'Wallet Top-up',
  payment: 'Wallet Payment',
  adjustment: 'Ledger Adjustment',
}

export default function AdminCustomerWallets() {
  const toast = useToast()
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailWallet, setDetailWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const loadWallets = async () => {
    setLoading(true)
    try {
      const params = { page, per_page: 15 }
      if (search.trim()) params.search = search.trim()
      const res = await api.get('/admin/customers/wallets', { params })
      const data = api.unwrapList(res.data)
      setWallets(data)
      setPagination(res.data?.meta?.pagination || { current_page: page, last_page: 1, total: data.length, per_page: 15 })
    } catch (err) {
      toast.error('Failed to load customer wallets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWallets()
  }, [page])

  const openDetail = async (wallet) => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailWallet(null)
    setTransactions([])
    try {
      const res = await api.get(`/admin/customers/wallets/${wallet.user_id}`)
      const data = res.data?.data || {}
      setDetailWallet(data.wallet || wallet)
      setTransactions(api.unwrapList({ data: data.transactions }))
    } catch (err) {
      toast.error('Failed to load wallet ledger.')
    } finally {
      setDetailLoading(false)
    }
  }

  const totalBalance = wallets.reduce((s, w) => s + (Number(w.balance) || 0), 0)
  const fundedCount = wallets.filter(w => Number(w.balance) > 0).length
  const totalCredited = wallets.reduce((s, w) => s + (Number(w.transactions_total) || 0), 0)

  const columns = [
    {
      header: 'Customer',
      render: item => {
        const c = item.customer || {}
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f3e8ff', color: '#9333ea', fontWeight: 800, fontSize: 12.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {initials(c.name || 'C')}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.email}</div>
            </div>
          </div>
        )
      }
    },
    {
      header: 'Balance',
      render: item => (
        <span style={{ fontSize: 13.5, fontWeight: 800, color: Number(item.balance) > 0 ? '#16a34a' : 'var(--muted)' }}>
          {money(Number(item.balance) || 0)}
        </span>
      )
    },
    {
      header: 'Transactions',
      render: item => <span style={{ fontSize: 12.5, fontWeight: 700 }}>{item.transactions_count ?? 0}</span>
    },
    {
      header: 'Total Credited',
      render: item => <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{money(Number(item.transactions_total) || 0)}</span>
    },
    {
      header: 'Last Activity',
      render: item => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          {item.updated_at ? timeAgo(item.updated_at) : '—'}
        </span>
      )
    },
    {
      header: 'Status',
      render: item => <StatusBadge status={item.customer?.status || 'active'} />
    },
    {
      header: '',
      align: 'right',
      render: item => (
        <button type="button" className="btn btn-outline btn-xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => openDetail(item)}>
          <Eye size={12} /> Ledger
        </button>
      )
    }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Customer Wallets"
        description="Wallet balances and full transaction ledgers for consumer accounts."
        breadcrumbs={[
          { label: 'Customers', to: '/admin/customers' },
          { label: 'Wallets' }
        ]}
        actions={
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadWallets}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8 }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
        <KpiCard label="Total Wallet Balance" value={money(totalBalance)} sub="Across all funded wallets" Icon={Wallet} iconBg="#f3e8ff" iconColor="#9333ea" />
        <KpiCard label="Funded Wallets" value={fundedCount.toLocaleString()} sub={`${wallets.length} wallets tracked`} Icon={ArrowDownLeft} iconBg="#e6f7ec" iconColor="#16a34a" />
        <KpiCard label="Total Credited" value={money(totalCredited)} sub="Cashback, refunds & top-ups" Icon={ArrowUpRight} iconBg="#fff0e6" iconColor="#ff5500" />
      </div>

      <div className="card" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: 4 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') loadWallets() }}
          placeholder="Search by customer name or email..."
          className="input"
          style={{ margin: 12, width: 'calc(100% - 24px)' }}
        />
        <DataTable
          columns={columns}
          data={wallets}
          loading={loading}
          pagination={pagination}
          onPageChange={setPage}
          emptyTitle="No customer wallets found"
          emptyDescription="Wallets will appear here once customers are onboarded."
        />
      </div>

      {detailOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setDetailOpen(false) }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '86vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f3e8ff', color: '#9333ea', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {initials(detailWallet?.customer?.name || 'C')}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{detailWallet?.customer?.name || 'Customer Wallet'}</h3>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{detailWallet?.customer?.email} · {detailWallet?.customer?.phone || 'No phone'}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-xs" onClick={() => setDetailOpen(false)}>✕</button>
            </div>

            <div style={{ background: '#faf5ff', border: '1px solid #f3e8ff', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#6b21a8' }}>Available Balance</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#7c3aed' }}>
                {detailLoading ? '…' : money(Number(detailWallet?.balance) || 0)}
              </span>
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transaction Ledger</div>
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 20, fontSize: 12.5, color: 'var(--muted)' }}>Loading ledger…</div>
              ) : transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, fontSize: 12.5, color: 'var(--muted)' }}>No transactions yet.</div>
              ) : (
                transactions.map(tx => {
                  const isCredit = Number(tx.amount) > 0
                  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight
                  return (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: isCredit ? '#e6f7ec' : '#fff1f2', color: isCredit ? '#16a34a' : '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{TRANSACTION_LABEL[tx.transaction_type] || tx.transaction_type}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</div>
                        <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>{formatDateTime(tx.created_at)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isCredit ? '#16a34a' : '#e11d48' }}>
                          {isCredit ? '+' : ''}{money(Number(tx.amount) || 0)}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Balance {money(Number(tx.balance_after) || 0)}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}