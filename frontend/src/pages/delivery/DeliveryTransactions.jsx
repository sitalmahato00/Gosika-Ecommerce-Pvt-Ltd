import React from 'react'
import { Link } from 'react-router-dom'
import { Receipt, Wallet, TrendingUp } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import { useDelivery } from '../../context/DeliveryContext'

export default function DeliveryTransactions() {
  const { rider } = useDelivery()

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Transactions</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Withdrawals, payouts and wallet adjustments for {rider?.name || 'your account'}.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 18, margin: 0, textAlign: 'center' }}>
        <div className="flex items-center justify-center gap-3 wrap mb-2">
          <div className="flex items-center gap-2">
            <span className="avatar" style={{ width: 40, height: 40, background: '#eef2ff', color: '#4f46e5' }}>
              <Wallet size={20} />
            </span>
            <div style={{ textAlign: 'left' }}>
              <div className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Wallet Balance</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)' }}>Rs. 0.00</div>
            </div>
          </div>
          <span className="chip chip-sm" style={{ background: '#f1f5f9', color: '#64748b' }}>
            Ledger managed by GOSIKA dispatch hub
          </span>
        </div>
        <p className="muted text-xs" style={{ maxWidth: 440, margin: '0 auto' }}>
          Your transaction history is maintained at the GOSIKA dispatch hub. Each confirmed delivery adds your fee to the wallet ledger, and payouts are scheduled by the operations team.
        </p>
      </div>

      <EmptyState
        icon={Receipt}
        title="No transactions available online"
        message="Withdrawals and payout requests are currently handled offline by the dispatch hub. Track your delivery earnings in the meantime."
        action={
          <Link to="/delivery/earnings" className="btn btn-primary btn-sm flex items-center gap-1.5">
            <TrendingUp size={14} /> View Earnings
          </Link>
        }
      />
    </div>
  )
}
