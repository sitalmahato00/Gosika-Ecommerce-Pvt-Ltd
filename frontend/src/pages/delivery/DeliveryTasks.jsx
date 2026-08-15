import React, { useState, useMemo } from 'react'
import {
  Truck, Search, MapPin, Phone, CheckCircle2, Clock,
  Package, User, Store, DollarSign, Download, Navigation,
  AlertTriangle, Filter, Eye
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const ALL_TASKS = [
  {
    id: 'DSP-2026-9901',
    orderId: 'ORD-2026-98101',
    item_title: '100% Pure Pashmina Cashmere Shawl (Handwoven)',
    item_count: 1,
    payment_mode: 'eSewa Prepaid',
    cod_amount: 0,
    status: 'in_transit',
    vendor: {
      name: 'Koshi Handicrafts Pvt. Ltd.',
      contact: 'Suman Pokhrel (+977 21-524901)',
      address: 'Main Bazaar Road, Ward 4, Biratnagar Hub',
    },
    customer: {
      name: 'Kshitiz Acharya',
      phone: '+977 980-1234567',
      address: 'Ward No. 3, Lazimpat Road, Near Radisson Hotel, Kathmandu',
    },
    date: '15 Aug 2026 08:45',
    earning: 180,
  },
  {
    id: 'DSP-2026-9874',
    orderId: 'ORD-2026-98074',
    item_title: 'Authentic Handwoven Koshi Dhaka Saree',
    item_count: 1,
    payment_mode: 'Cash on Delivery (COD)',
    cod_amount: 6200,
    status: 'picked_up',
    vendor: {
      name: 'Eastern Dhaka Textile Weavers',
      contact: 'Bina Rai (+977 26-520114)',
      address: 'Industrial Estate Block B, Itahari Hub',
    },
    customer: {
      name: 'Sita Kumari Rai',
      phone: '+977 986-2123456',
      address: 'Gorkha Galli, Ward No. 5, Itahari Sub-Metropolitan',
    },
    date: '15 Aug 2026 09:30',
    earning: 220,
  },
  {
    id: 'DSP-2026-9912',
    orderId: 'ORD-2026-98112',
    item_title: 'Organic Ilam Orthodox Black Tea (2x 500g)',
    item_count: 2,
    payment_mode: 'Cash on Delivery (COD)',
    cod_amount: 2400,
    status: 'assigned',
    vendor: {
      name: 'Himalayan Organic Herbs & Tea',
      contact: 'Dipendra Ilam (+977 27-520112)',
      address: 'Tea Estate Hub, Ilam Road',
    },
    customer: {
      name: 'Deepak KC',
      phone: '+977 984-7654321',
      address: 'Traffic Chowk, Milan Park, Dharan',
    },
    date: '15 Aug 2026 10:15',
    earning: 250,
  },
  {
    id: 'DSP-2026-9861',
    orderId: 'ORD-2026-98061',
    item_title: 'Handcrafted Tibetan Singing Bowl (7 Metals)',
    item_count: 1,
    payment_mode: 'Khalti Prepaid',
    cod_amount: 0,
    status: 'delivered',
    vendor: {
      name: 'Lalitpur Heritage Metal & Bronze',
      contact: 'Babu Ratna (+977 1-5521980)',
      address: 'Patan Durbar Square, Lalitpur',
    },
    customer: {
      name: 'Anil Thapa',
      phone: '+977 985-1098765',
      address: 'Bhanuchowk Commercial Lane, Dharan',
    },
    date: '14 Aug 2026 18:30',
    earning: 200,
  },
  {
    id: 'DSP-2026-9850',
    orderId: 'ORD-2026-98050',
    item_title: 'Organic Dried Himalayan Apples & Apricots (1kg)',
    item_count: 1,
    payment_mode: 'Fonepay Prepaid',
    cod_amount: 0,
    status: 'delivered',
    vendor: {
      name: 'Mustang Himalayan Dry Fruits',
      contact: 'Tashi Gurung (+977 69-520011)',
      address: 'Jomsom Airport Gate, Mustang',
    },
    customer: {
      name: 'Bikash Gurung',
      phone: '+977 984-7123987',
      address: 'Traffic Chowk, Butwal',
    },
    date: '14 Aug 2026 16:45',
    earning: 190,
  },
]

export default function DeliveryTasks() {
  const toast = useToast()
  const [tasks, setTasks] = useState(ALL_TASKS)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)

  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    toast.success(`Task ${taskId} status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`)
  }

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const matchId = t.id.toLowerCase().includes(q)
        const matchOrder = t.orderId.toLowerCase().includes(q)
        const matchCust = t.customer.name.toLowerCase().includes(q)
        const matchVendor = t.vendor.name.toLowerCase().includes(q)
        const matchItem = t.item_title.toLowerCase().includes(q)
        if (!matchId && !matchOrder && !matchCust && !matchVendor && !matchItem) return false
      }
      return true
    })
  }, [tasks, statusFilter, search])

  const exportCSV = () => {
    const rows = [
      ['Task ID', 'Order Reference', 'Item Title', 'Payment Mode', 'COD Amount (NPR)', 'Merchant Workshop', 'Customer Destination', 'Phone', 'Rider Fee (NPR)', 'Status', 'Date'],
      ...filtered.map(t => [
        t.id,
        t.orderId,
        t.item_title,
        t.payment_mode,
        t.cod_amount,
        t.vendor.name,
        t.customer.address,
        t.customer.phone,
        t.earning,
        t.status,
        t.date,
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `gosika_rider_tasks_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Rider tasks exported to CSV')
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Assigned Delivery Tasks
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Manage pending workshop pick-ups, in-transit parcels, and doorstep customer drop-offs across your zone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 8 }}>
        {[
          { value: '', label: `All Tasks (${tasks.length})` },
          { value: 'assigned', label: `Assigned (${tasks.filter(t => t.status === 'assigned').length})` },
          { value: 'picked_up', label: `Picked Up (${tasks.filter(t => t.status === 'picked_up').length})` },
          { value: 'in_transit', label: `In Transit (${tasks.filter(t => t.status === 'in_transit').length})` },
          { value: 'delivered', label: `Delivered (${tasks.filter(t => t.status === 'delivered').length})` },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${statusFilter === t.value ? 'active' : ''}`}
            onClick={() => setStatusFilter(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card flex items-center justify-between wrap gap-3" style={{ padding: '12px 18px', margin: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
            placeholder="Search by task #, order, customer, or merchant…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span className="muted text-xs font-semibold">
          {filtered.length} task{filtered.length !== 1 ? 's' : ''} listed
        </span>
      </div>

      {/* Tasks Table */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Dispatch ID</th>
                <th>Order Ref</th>
                <th>Item & Quantity</th>
                <th>Merchant Pickup</th>
                <th>Buyer Destination</th>
                <th>Payment Mode</th>
                <th>Rider Payout</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="font-mono font-bold text-primary text-xs" style={{ cursor: 'pointer' }} onClick={() => setSelectedTask(t)}>
                      {t.id}
                    </span>
                    <div className="muted text-xs" style={{ fontSize: 10 }}>{t.date}</div>
                  </td>
                  <td>
                    <span className="font-mono font-bold text-ink text-xs">#{t.orderId}</span>
                  </td>
                  <td>
                    <div className="font-semibold text-xs text-ink line-clamp-1" title={t.item_title}>{t.item_title}</div>
                    <div className="muted text-xs">{t.item_count} parcel</div>
                  </td>
                  <td>
                    <div className="font-bold text-xs text-ink">{t.vendor.name}</div>
                    <div className="muted text-xs truncate" style={{ maxWidth: 180, fontSize: 10 }}>{t.vendor.address}</div>
                  </td>
                  <td>
                    <div className="font-bold text-xs text-ink">{t.customer.name}</div>
                    <div className="muted text-xs truncate" style={{ maxWidth: 180, fontSize: 10 }}>{t.customer.address}</div>
                  </td>
                  <td>
                    <span className="chip chip-sm font-semibold" style={{ fontSize: 10 }}>{t.payment_mode}</span>
                    {t.cod_amount > 0 && (
                      <div className="text-xs font-bold" style={{ color: '#d97706', fontSize: 10 }}>{money(t.cod_amount)}</div>
                    )}
                  </td>
                  <td>
                    <span className="font-bold text-sm text-success">+{money(t.earning)}</span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 800,
                        textTransform: 'capitalize',
                        background: t.status === 'delivered' ? '#ecfdf5' : t.status === 'in_transit' ? '#e0e7ff' : '#fef3c7',
                        color: t.status === 'delivered' ? '#10b981' : t.status === 'in_transit' ? '#4338ca' : '#d97706',
                      }}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs flex items-center gap-1"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => setSelectedTask(t)}
                    >
                      <Eye size={11} /> Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Dossier Modal */}
      {selectedTask && (
        <Modal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Delivery Task Dossier: ${selectedTask.id}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 14, margin: 0 }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-ink">{selectedTask.item_title}</span>
                <span className="chip chip-sm font-bold">{selectedTask.status}</span>
              </div>
              <div className="muted text-xs">Order Ref: <strong>#{selectedTask.orderId}</strong> · Delivery Payout: <strong className="text-success">+{money(selectedTask.earning)}</strong></div>
            </div>

            <div className="card" style={{ padding: 14, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                <Store size={13} color="var(--primary)" /> Workshop Pickup Location
              </h4>
              <div className="text-xs">
                <div className="font-bold text-ink">{selectedTask.vendor.name}</div>
                <div className="muted mt-0.5">{selectedTask.vendor.address}</div>
                <div className="muted mt-0.5">Phone: {selectedTask.vendor.contact}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                <User size={13} color="#10b981" /> Buyer Destination Address
              </h4>
              <div className="text-xs">
                <div className="font-bold text-ink">{selectedTask.customer.name}</div>
                <div className="muted mt-0.5">{selectedTask.customer.address}</div>
                <div className="muted mt-0.5">Phone: {selectedTask.customer.phone}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelectedTask(null)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
