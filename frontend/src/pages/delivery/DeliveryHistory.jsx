import React, { useState, useMemo } from 'react'
import {
  Clock, Search, CheckCircle2, MapPin, Download,
  Eye, Calendar, DollarSign, User, Store, ShieldCheck
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const PAST_DELIVERIES = [
  {
    id: 'DSP-2026-9898',
    orderId: 'ORD-2026-98098',
    item_title: 'Traditional Carved Wooden Peacock Window',
    customer: 'Pooja Sharma',
    phone: '+977 984-1987654',
    address: 'Lakeside Ward 6, Near Barahi Temple, Pokhara',
    vendor: 'Koshi Handicrafts Pvt. Ltd.',
    delivered_at: '15 Aug 2026 11:30 AM',
    distance: '6.8 km',
    payout: 220,
    cod_collected: 0,
    payment_mode: 'Prepaid (eSewa)',
    otp_verified: true,
  },
  {
    id: 'DSP-2026-9892',
    orderId: 'ORD-2026-98092',
    item_title: 'Organic Ilam Orthodox Black Tea (500g Pack)',
    customer: 'Prashant Shrestha',
    phone: '+977 981-2345678',
    address: 'Main Road Traffic Chowk, Ward No. 4, Biratnagar',
    vendor: 'Himalayan Organic Herbs & Tea',
    delivered_at: '15 Aug 2026 10:15 AM',
    distance: '3.2 km',
    payout: 150,
    cod_collected: 1530,
    payment_mode: 'Cash on Delivery (COD)',
    otp_verified: true,
  },
  {
    id: 'DSP-2026-9885',
    orderId: 'ORD-2026-98085',
    item_title: 'Handcrafted Tibetan Singing Bowl (7 Metals)',
    customer: 'Anil Thapa',
    phone: '+977 985-1098765',
    address: 'Bhanuchowk Commercial Lane, Ward No. 2, Dharan',
    vendor: 'Lalitpur Heritage Metal & Bronze',
    delivered_at: '14 Aug 2026 06:15 PM',
    distance: '12.4 km',
    payout: 280,
    cod_collected: 3400,
    payment_mode: 'Cash on Delivery (COD)',
    otp_verified: true,
  },
  {
    id: 'DSP-2026-9861',
    orderId: 'ORD-2026-98061',
    item_title: 'Organic Dried Himalayan Apples & Apricots (1kg)',
    customer: 'Bikash Gurung',
    phone: '+977 984-7123987',
    address: 'Traffic Chowk, Milan Park Road, Butwal',
    vendor: 'Mustang Himalayan Dry Fruits',
    delivered_at: '14 Aug 2026 04:45 PM',
    distance: '4.5 km',
    payout: 180,
    cod_collected: 0,
    payment_mode: 'Prepaid (Khalti)',
    otp_verified: true,
  },
  {
    id: 'DSP-2026-9844',
    orderId: 'ORD-2026-98044',
    item_title: 'Palpali Traditional Dhaka Topi (Pure Handloom)',
    customer: 'Suman Shrestha',
    phone: '+977 981-1239876',
    address: 'New Road, Ward 22, Kathmandu',
    vendor: 'Palpali Dhaka Weavers',
    delivered_at: '13 Aug 2026 02:20 PM',
    distance: '2.8 km',
    payout: 140,
    cod_collected: 0,
    payment_mode: 'Prepaid (Fonepay)',
    otp_verified: true,
  },
]

export default function DeliveryHistory() {
  const toast = useToast()
  const [history, setHistory] = useState(PAST_DELIVERIES)
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  const filtered = useMemo(() => {
    return history.filter(d => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        d.id.toLowerCase().includes(q) ||
        d.orderId.toLowerCase().includes(q) ||
        d.customer.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q) ||
        d.item_title.toLowerCase().includes(q)
      )
    })
  }, [history, search])

  const exportCSV = () => {
    const rows = [
      ['Dispatch ID', 'Order Reference', 'Item Title', 'Customer Name', 'Address', 'Delivered At', 'Distance', 'Rider Fee (NPR)', 'COD Collected (NPR)', 'Payment Mode'],
      ...filtered.map(d => [
        d.id,
        d.orderId,
        d.item_title,
        d.customer,
        d.address,
        d.delivered_at,
        d.distance,
        d.payout,
        d.cod_collected,
        d.payment_mode,
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_delivery_history_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Delivery history exported to CSV')
  }

  const totalDelivered = history.length
  const totalEarned = history.reduce((sum, d) => sum + d.payout, 0)
  const totalCodCollected = history.reduce((sum, d) => sum + d.cod_collected, 0)

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Delivery History & Completed Dispatches
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Review past delivered orders, delivery completion timestamps, OTP verifications, and payout earnings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase">Fulfilled Parcels</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{totalDelivered} Completed</div>
          <div className="muted text-xs mt-1">100% on-time compliance</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase">Total Delivery Fees</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{money(totalEarned)}</div>
          <div className="muted text-xs mt-1">Direct rider payout ledger</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase">Total COD Cash Handled</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Clock size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(totalCodCollected)}</div>
          <div className="muted text-xs mt-1">Deposited to GOSIKA Central Hub</div>
        </div>
      </div>

      {/* Search */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search completed deliveries by ID, customer, or product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-xs font-semibold">
          {filtered.length} completed deliver{filtered.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>

      {/* History Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Dispatch ID</th>
                <th>Order Ref</th>
                <th>Item Title</th>
                <th>Buyer Customer</th>
                <th>Delivered Timestamp</th>
                <th>Distance</th>
                <th>COD Handled</th>
                <th>Rider Payout</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="font-mono font-bold text-primary text-xs" style={{ cursor: 'pointer' }} onClick={() => setSelectedItem(d)}>
                      {d.id}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-ink">#{d.orderId}</span>
                  </td>
                  <td>
                    <div className="font-bold text-xs text-ink line-clamp-1" title={d.item_title}>{d.item_title}</div>
                    <div className="muted text-xs">{d.vendor}</div>
                  </td>
                  <td>
                    <div className="font-bold text-xs text-ink">{d.customer}</div>
                    <div className="muted text-xs truncate" style={{ maxWidth: 180, fontSize: 10 }}>{d.address}</div>
                  </td>
                  <td className="muted text-xs">
                    {d.delivered_at}
                  </td>
                  <td className="muted text-xs font-semibold">
                    {d.distance}
                  </td>
                  <td>
                    {d.cod_collected > 0 ? (
                      <span className="font-bold text-xs" style={{ color: '#d97706' }}>{money(d.cod_collected)}</span>
                    ) : (
                      <span className="muted text-xs">Prepaid</span>
                    )}
                  </td>
                  <td>
                    <span className="font-bold text-sm text-success">+{money(d.payout)}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs flex items-center gap-1"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => setSelectedItem(d)}
                    >
                      <Eye size={11} /> Proof
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Modal */}
      {selectedItem && (
        <Modal
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={`Delivery Confirmation Proof: ${selectedItem.id}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ background: '#ecfdf5', padding: 14, margin: 0, border: '1px solid #bbf7d0' }}>
              <div className="flex items-center gap-2 mb-1" style={{ color: '#166534', fontWeight: 800 }}>
                <CheckCircle2 size={16} /> Delivery Successfully Fulfilled
              </div>
              <div className="text-xs" style={{ color: '#166534' }}>
                Delivered on <strong>{selectedItem.delivered_at}</strong> · OTP Verified by customer
              </div>
            </div>

            <div className="text-xs grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="card" style={{ padding: 12, margin: 0 }}>
                <span className="muted block">Customer Name:</span>
                <strong className="text-ink text-sm">{selectedItem.customer}</strong>
                <span className="muted block mt-1">Phone: {selectedItem.phone}</span>
                <span className="muted block mt-0.5">{selectedItem.address}</span>
              </div>

              <div className="card" style={{ padding: 12, margin: 0 }}>
                <span className="muted block">Rider Payout Credited:</span>
                <strong className="text-success text-base font-bold">+{money(selectedItem.payout)}</strong>
                <span className="muted block mt-1">Payment Mode: {selectedItem.payment_mode}</span>
                {selectedItem.cod_collected > 0 && (
                  <span className="block mt-0.5 font-bold" style={{ color: '#d97706' }}>COD Cash: {money(selectedItem.cod_collected)}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedItem(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
