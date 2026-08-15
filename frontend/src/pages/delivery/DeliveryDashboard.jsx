import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Truck, MapPin, Phone, CheckCircle2, Clock, DollarSign,
  AlertTriangle, Navigation, ArrowRight, ShieldCheck, Power,
  Package, User, Store, Banknote, Calendar, ChevronRight, FileText
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

const INITIAL_ACTIVE_TASKS = [
  {
    id: 'DSP-2026-9901',
    orderId: 'ORD-2026-98101',
    item_title: '100% Pure Pashmina Cashmere Shawl (Handwoven)',
    item_count: 1,
    payment_mode: 'eSewa Prepaid',
    cod_amount: 0,
    status: 'in_transit', // assigned | picked_up | in_transit | delivered | failed
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
    distance: '3.4 km from your GPS location',
    eta: 'Today, 4:30 PM',
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
    distance: '5.1 km',
    eta: 'Today, 5:45 PM',
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
    distance: '8.2 km',
    eta: 'Tomorrow, 11:00 AM',
    earning: 250,
  },
]

export default function DeliveryDashboard() {
  const toast = useToast()
  const [isOnDuty, setIsOnDuty] = useState(true)
  const [tasks, setTasks] = useState(INITIAL_ACTIVE_TASKS)
  const [selectedTask, setSelectedTask] = useState(null)
  const [completeModalTask, setCompleteModalTask] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [cashCollected, setCashCollected] = useState(true)
  const [actionBusy, setActionBusy] = useState(false)

  const toggleDuty = () => {
    const next = !isOnDuty
    setIsOnDuty(next)
    if (next) {
      toast.success('You are now ONLINE & ready to receive dispatch assignments!')
    } else {
      toast.info('You are now OFFLINE (Paused from receiving new dispatches).')
    }
  }

  const handleUpdateStatus = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    toast.success(`Task ${taskId} status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`)
  }

  const handleConfirmDelivery = (e) => {
    e.preventDefault()
    if (!completeModalTask) return
    setActionBusy(true)
    setTimeout(() => {
      setTasks(tasks.map(t => t.id === completeModalTask.id ? { ...t, status: 'delivered' } : t))
      setActionBusy(false)
      toast.success(`Delivery #${completeModalTask.id} marked as DELIVERED! Rs. ${completeModalTask.earning} credited to rider earnings.`)
      setCompleteModalTask(null)
      setOtpCode('')
    }, 600)
  }

  // Summary Metrics
  const activeCount = tasks.filter(t => t.status !== 'delivered' && t.status !== 'failed').length
  const inTransitCount = tasks.filter(t => t.status === 'in_transit' || t.status === 'picked_up').length
  const completedTodayCount = 8
  const todayEarnings = 1850
  const codInHand = 8600

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Page Header with Duty Status Switcher */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <div className="flex items-center gap-2 mb-1">
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
              Rider Dispatch Dashboard
            </h1>
            <span
              className="chip chip-sm"
              style={{
                background: isOnDuty ? '#ecfdf5' : '#f8fafc',
                color: isOnDuty ? '#10b981' : '#64748b',
                fontWeight: 800,
                fontSize: 11,
              }}
            >
              ● {isOnDuty ? 'ONLINE / ON DUTY' : 'OFFLINE'}
            </span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
            Welcome back, <strong>Bikash Shrestha</strong> · Assigned to <strong>Kathmandu Central Logistics Hub</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm flex items-center gap-1.5 ${isOnDuty ? 'btn-danger-outline' : 'btn-success'}`}
            onClick={toggleDuty}
          >
            <Power size={14} /> {isOnDuty ? 'Go Offline (Break)' : 'Go Online (Start Shift)'}
          </button>
        </div>
      </div>

      {/* 4 Rider KPI Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Active Assignments</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'var(--primary-50)', color: 'var(--primary)' }}>
              <Truck size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>{activeCount} Tasks Pending</div>
          <div className="muted text-xs mt-1">Pick-up & Drop-off queue</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0, border: inTransitCount > 0 ? '2px solid rgba(99, 102, 241, 0.3)' : '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em', color: '#4338ca' }}>On Road / In Transit</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' }}>
              <Navigation size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5' }}>{inTransitCount} Out on Route</div>
          <div className="muted text-xs mt-1">Live GPS navigation active</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>Today's Earnings</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <DollarSign size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981' }}>{money(todayEarnings)}</div>
          <div className="muted text-xs mt-1">{completedTodayCount} deliveries fulfilled today</div>
        </div>

        <div className="card flex flex-col justify-between" style={{ padding: '16px 18px', margin: 0 }}>
          <div className="flex items-center justify-between mb-2">
            <span className="muted text-xs font-bold uppercase" style={{ letterSpacing: '0.04em' }}>COD Cash in Hand</span>
            <span className="avatar" style={{ width: 34, height: 34, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Banknote size={18} />
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#d97706' }}>{money(codInHand)}</div>
          <div className="muted text-xs mt-1">Ready for daily hub remittance</div>
        </div>
      </div>

      {/* Active Dispatches List */}
      <div className="card card-pad-none" style={{ overflow: 'hidden', margin: 0 }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink)' }}>
              <Truck size={17} color="var(--primary)" /> Today's Assigned Delivery Tasks ({activeCount})
            </h3>
            <p className="muted text-xs m-0 mt-0.5">Accept assignments, pick up from artisan workshops, and deliver to customer doorsteps.</p>
          </div>
          <Link to="/delivery/tasks" className="btn btn-outline btn-xs flex items-center gap-1">
            View All Tasks <ArrowRight size={12} />
          </Link>
        </div>

        <div className="flex flex-col divide-y divide-slate-100">
          {tasks.map((t) => {
            const isAssigned = t.status === 'assigned'
            const isPickedUp = t.status === 'picked_up'
            const isInTransit = t.status === 'in_transit'
            const isDelivered = t.status === 'delivered'

            return (
              <div
                key={t.id}
                style={{
                  padding: '16px 20px',
                  background: isDelivered ? '#f8fafc' : '#ffffff',
                  opacity: isDelivered ? 0.75 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Top Row: Dispatch Ref, Item & Status */}
                <div className="flex items-center justify-between wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary text-xs" style={{ background: 'var(--primary-50)', padding: '3px 8px', borderRadius: 4 }}>
                      {t.id}
                    </span>
                    <span className="muted text-xs font-mono">Order: #{t.orderId}</span>
                    <span className="chip chip-sm font-semibold" style={{ fontSize: 10 }}>
                      {t.payment_mode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: '#16a34a' }}>
                      Rider Fee: +{money(t.earning)}
                    </span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: 'capitalize',
                        background: isDelivered ? '#ecfdf5' : isInTransit ? '#e0e7ff' : isPickedUp ? '#fef3c7' : '#f1f5f9',
                        color: isDelivered ? '#10b981' : isInTransit ? '#4338ca' : isPickedUp ? '#d97706' : '#475569',
                      }}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Product Title */}
                <div className="font-bold text-sm text-ink">
                  {t.item_title} <span className="muted font-normal text-xs">({t.item_count} parcel)</span>
                </div>

                {/* Origin Workshop vs Buyer Destination */}
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, fontSize: 12 }}>
                  {/* Workshop Origin */}
                  <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="muted font-bold text-xs flex items-center gap-1">
                        <Store size={12} color="var(--primary)" /> Workshop Pickup:
                      </span>
                      <a href={`tel:${t.vendor.contact.split('(')[1]?.replace(')', '') || '+97714000000'}`} className="btn btn-ghost btn-xs text-primary flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                        <Phone size={10} /> Call Vendor
                      </a>
                    </div>
                    <div className="font-bold text-ink">{t.vendor.name}</div>
                    <div className="muted text-xs mt-0.5">{t.vendor.address}</div>
                  </div>

                  {/* Customer Drop-off */}
                  <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="muted font-bold text-xs flex items-center gap-1">
                        <User size={12} color="#10b981" /> Buyer Drop-off:
                      </span>
                      <a href={`tel:${t.customer.phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                        <Phone size={10} /> Call Customer
                      </a>
                    </div>
                    <div className="font-bold text-ink">{t.customer.name} · {t.customer.phone}</div>
                    <div className="muted text-xs mt-0.5">{t.customer.address}</div>
                  </div>
                </div>

                {/* Bottom Action Workflow Buttons */}
                <div className="flex items-center justify-between wrap gap-2 pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="flex items-center gap-2 text-xs muted">
                    <span>ETA: <strong>{t.eta}</strong></span>
                    <span>·</span>
                    <span>Distance: <strong>{t.distance}</strong></span>
                    {t.cod_amount > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-bold" style={{ color: '#d97706' }}>Collect COD: {money(t.cod_amount)}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isAssigned && (
                      <button
                        type="button"
                        className="btn btn-primary btn-xs flex items-center gap-1"
                        onClick={() => handleUpdateStatus(t.id, 'picked_up')}
                      >
                        <Package size={12} /> Accept & Pick Up from Vendor
                      </button>
                    )}

                    {isPickedUp && (
                      <button
                        type="button"
                        className="btn btn-primary btn-xs flex items-center gap-1"
                        onClick={() => handleUpdateStatus(t.id, 'in_transit')}
                      >
                        <Navigation size={12} /> Start Route (Out for Delivery)
                      </button>
                    )}

                    {isInTransit && (
                      <button
                        type="button"
                        className="btn btn-success btn-xs flex items-center gap-1"
                        onClick={() => setCompleteModalTask(t)}
                      >
                        <CheckCircle2 size={12} /> Confirm Delivered (Collect Signature/OTP)
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => setSelectedTask(t)}
                    >
                      Dossier
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Complete Delivery Modal (OTP Verification & COD confirmation) */}
      {completeModalTask && (
        <Modal
          open={!!completeModalTask}
          onClose={() => setCompleteModalTask(null)}
          title={`Confirm Delivery: #${completeModalTask.id}`}
        >
          <form onSubmit={handleConfirmDelivery} className="flex flex-col gap-3">
            <div className="card" style={{ background: 'var(--bg)', padding: 14, margin: 0 }}>
              <div className="font-bold text-sm text-ink mb-1">{completeModalTask.customer.name}</div>
              <div className="muted text-xs mb-2">{completeModalTask.customer.address}</div>
              {completeModalTask.cod_amount > 0 ? (
                <div className="alert alert-warning" style={{ padding: '8px 12px', fontSize: 12 }}>
                  <strong>Cash on Delivery:</strong> Please collect exactly <strong>{money(completeModalTask.cod_amount)}</strong> in cash before handing over the parcel.
                </div>
              ) : (
                <div className="badge badge-success" style={{ width: 'fit-content' }}>
                  Prepaid Order — No cash collection required
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label">Customer Delivery OTP Code (4-Digits) <span className="req">*</span></label>
              <input
                className="input font-mono font-bold text-center"
                style={{ fontSize: 18, letterSpacing: '0.2em' }}
                maxLength={4}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="4 9 1 2"
              />
              <span className="muted text-xs mt-1 block">The customer received this 4-digit code on their SMS notification.</span>
            </div>

            {completeModalTask.cod_amount > 0 && (
              <label className="flex items-center gap-2 cursor-pointer mt-1" style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  required
                  checked={cashCollected}
                  onChange={(e) => setCashCollected(e.target.checked)}
                />
                <span className="font-bold text-ink">I have verified and collected {money(completeModalTask.cod_amount)} cash in full</span>
              </label>
            )}

            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setCompleteModalTask(null)}>Cancel</button>
              <button type="submit" className="btn btn-success btn-sm flex items-center gap-1" disabled={actionBusy}>
                <CheckCircle2 size={14} /> {actionBusy ? 'Verifying…' : 'Complete Delivery'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Task Dossier Modal */}
      {selectedTask && (
        <Modal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Task Dossier: ${selectedTask.id}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ background: 'var(--bg)', padding: 14, margin: 0 }}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-ink">{selectedTask.item_title}</span>
                <span className="chip chip-sm font-bold">{selectedTask.status}</span>
              </div>
              <div className="muted text-xs">Order Ref: <strong>#{selectedTask.orderId}</strong> · Fee: <strong className="text-success">+{money(selectedTask.earning)}</strong></div>
            </div>

            <div className="card" style={{ padding: 14, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                <Store size={13} color="var(--primary)" /> Workshop Pickup Point
              </h4>
              <div className="text-xs">
                <div className="font-bold text-ink">{selectedTask.vendor.name}</div>
                <div className="muted mt-0.5">{selectedTask.vendor.address}</div>
                <div className="muted mt-0.5">Contact: {selectedTask.vendor.contact}</div>
              </div>
            </div>

            <div className="card" style={{ padding: 14, margin: 0 }}>
              <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }} className="flex items-center gap-1.5">
                <User size={13} color="#10b981" /> Customer Drop-off Destination
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
