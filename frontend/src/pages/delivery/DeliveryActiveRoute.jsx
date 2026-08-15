import React, { useState } from 'react'
import {
  MapPin, Navigation, Phone, Store, User, CheckCircle2,
  Clock, AlertTriangle, ExternalLink, ArrowRight, ShieldCheck
} from 'lucide-react'
import { money } from '../../utils/format'
import { useToast } from '../../context/ToastContext'

export default function DeliveryActiveRoute() {
  const toast = useToast()
  const [trafficReported, setTrafficReported] = useState(false)

  const handleTrafficAlert = () => {
    setTrafficReported(true)
    toast.info('Traffic congestion alert logged. Customer notified of possible +15 min delay.')
  }

  const openExternalMaps = (destination) => {
    toast.success(`Opening GPS navigation for: ${destination}`)
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>
            Active Route & Live GPS Waypoints
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Turn-by-turn waypoint navigation from artisan pickup workshop to customer delivery doorstep.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1"
            onClick={() => openExternalMaps('Lazimpat Road, Kathmandu')}
          >
            <Navigation size={14} /> Open in GPS Navigation
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 18 }}>
        {/* Route Map Visualizer Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', margin: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="font-bold text-sm text-ink flex items-center gap-1.5">
              <MapPin size={15} color="var(--primary)" /> Kathmandu Urban Corridor · Active Route
            </span>
            <span className="chip chip-sm font-bold" style={{ background: '#ecfdf5', color: '#10b981' }}>
              ● 3.4 km Remaining (ETA: 18 Mins)
            </span>
          </div>

          {/* Interactive Simulated Map Canvas */}
          <div style={{ position: 'relative', width: '100%', height: 320, background: '#1e293b' }}>
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1000&auto=format&fit=crop&q=80"
              alt="Live Navigation Map"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
            />

            {/* Overlay Navigation HUD */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                right: 14,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="avatar" style={{ width: 32, height: 32, background: 'var(--primary)', color: '#ffffff' }}>
                  <Navigation size={16} />
                </span>
                <div>
                  <div className="font-bold text-xs">Turn Right onto Lazimpat Road in 400m</div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>Next: Radisson Hotel Roundabout</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm" style={{ color: '#10b981' }}>18 min</div>
                <div className="text-xs" style={{ color: '#94a3b8' }}>3.4 km</div>
              </div>
            </div>

            {/* Waypoint Pin 1: Pickup Workshop */}
            <div style={{ position: 'absolute', bottom: 30, left: 30, background: '#ffffff', padding: '6px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Store size={13} color="var(--primary)" /> Koshi Workshop (Picked Up)
            </div>

            {/* Waypoint Pin 2: Dropoff */}
            <div style={{ position: 'absolute', top: 90, right: 30, background: '#10b981', color: '#ffffff', padding: '6px 12px', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={13} /> Kshitiz Acharya (Drop-off)
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Waypoint Checklist */}
        <div className="card flex flex-col justify-between" style={{ padding: 20, margin: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px 0', color: 'var(--ink)' }}>
              Dispatch Waypoints (#DSP-2026-9901)
            </h3>

            {/* Step 1 */}
            <div className="flex items-start gap-3 mb-4">
              <span className="avatar" style={{ width: 28, height: 28, background: '#ecfdf5', color: '#10b981', flexShrink: 0, marginTop: 2 }}>
                <CheckCircle2 size={15} />
              </span>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center">
                  <strong className="text-ink">1. Workshop Pickup · COMPLETED</strong>
                  <span className="muted font-mono">08:45 AM</span>
                </div>
                <div className="muted mt-0.5">Koshi Handicrafts Pvt. Ltd. · Biratnagar Hub</div>
                <div className="font-medium text-ink mt-0.5">100% Pure Pashmina Cashmere Shawl (1 parcel)</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3 mb-4">
              <span className="avatar" style={{ width: 28, height: 28, background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', flexShrink: 0, marginTop: 2 }}>
                <Navigation size={15} />
              </span>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center">
                  <strong className="text-primary">2. In-Transit on Route · ACTIVE</strong>
                  <span className="muted font-mono">Current Leg</span>
                </div>
                <div className="muted mt-0.5">Ring Road Corridor → Lazimpat Road</div>
                <div className="text-xs font-semibold" style={{ color: '#4f46e5', marginTop: 2 }}>Speed: 38 km/h · ETA: 4:30 PM</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <span className="avatar" style={{ width: 28, height: 28, background: 'var(--bg)', color: 'var(--muted)', flexShrink: 0, marginTop: 2 }}>
                <MapPin size={15} />
              </span>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-center">
                  <strong className="text-ink">3. Customer Drop-off · PENDING</strong>
                  <span className="muted font-mono">Estimated 4:30 PM</span>
                </div>
                <div className="font-bold text-ink mt-0.5">Kshitiz Acharya (+977 980-1234567)</div>
                <div className="muted mt-0.5">Ward No. 3, Lazimpat Road, Near Radisson Hotel, Kathmandu</div>
                <div className="badge badge-success mt-1.5" style={{ width: 'fit-content', fontSize: 10 }}>
                  Prepaid via eSewa (No Cash Collection)
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between wrap gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <button
              type="button"
              className="btn btn-outline btn-xs flex items-center gap-1"
              disabled={trafficReported}
              onClick={handleTrafficAlert}
            >
              <AlertTriangle size={12} color="#f59e0b" /> {trafficReported ? 'Traffic Alert Logged' : 'Report Traffic Delay'}
            </button>

            <a
              href="tel:+9779801234567"
              className="btn btn-success btn-xs flex items-center gap-1"
            >
              <Phone size={12} /> Call Customer Now
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
