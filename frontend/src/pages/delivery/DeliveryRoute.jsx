import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Map, Store, MapPin, Navigation, ExternalLink, LocateFixed,
  Phone, RefreshCw, Loader2,
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import { money, formatDateTime, errorMessage } from '../../utils/format'
import { ACTIVE_STATUSES } from '../../utils/delivery'
import DeliveryStatusBadge from '../../components/delivery/DeliveryStatusBadge'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../context/ToastContext'

function encodePlace(addr) {
  return encodeURIComponent(String(addr || '').trim())
}

export default function DeliveryRoute() {
  const toast = useToast()
  const assignments = useApi(() => api.get('/delivery-partner/assignments', { params: { per_page: 100 } }))
  const me = useApi(() => api.get('/delivery-partner/me'))
  const [locating, setLocating] = useState(false)
  const [livePos, setLivePos] = useState(null)

  const active = useMemo(
    () => (assignments.data?.data ?? []).filter((a) => ACTIVE_STATUSES.includes(a.status)),
    [assignments.data],
  )

  const rider = me.data?.data || me.data || {}
  const partnerPos = livePos || (rider.latitude && rider.longitude ? { lat: rider.latitude, lng: rider.longitude } : null)

  const stops = useMemo(() => {
    const pickup = active.find((a) => a.pickup_address)?.pickup_address || null
    return [
      ...(pickup ? [{ id: 'pickup', type: 'pickup', label: 'Pickup at vendor', address: pickup }] : []),
      ...active.map((a) => ({
        id: a.id,
        type: 'dropoff',
        label: a.recipient_name || 'Customer',
        address: a.dropoff_address || '',
        assignment: a,
      })),
    ]
  }, [active])

  const mapsUrl = useMemo(() => {
    const origin = partnerPos ? `${partnerPos.lat},${partnerPos.lng}` : stops[0]?.address
    const drops = stops.filter((s) => s.type === 'dropoff')
    if (!origin || drops.length === 0) return null
    const url = new URL('https://www.google.com/maps/dir/')
    url.searchParams.set('api', '1')
    url.searchParams.set('origin', origin)
    url.searchParams.set('destination', encodePlace(drops[drops.length - 1].address))
    if (drops.length > 1) {
      url.searchParams.set('waypoints', drops.slice(0, -1).map((d) => encodePlace(d.address)).join('|'))
    }
    url.searchParams.set('travelmode', 'driving')
    return url.toString()
  }, [partnerPos, stops])

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLivePos({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        toast.success('Location captured — directions will start from your current position.')
      },
      () => {
        setLocating(false)
        toast.error('Could not get your location. Grant location permission and try again.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const loading = assignments.loading || me.loading

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-4 pb-8">
        <div className="page-header" style={{ marginBottom: 8 }}>
          <Skeleton width={240} height={28} />
        </div>
        <div className="card" style={{ padding: 20, margin: 0 }}>
          <Skeleton height={160} />
        </div>
      </div>
    )
  }

  if (assignments.error || me.error) {
    return <ErrorState message={errorMessage(assignments.error || me.error)} onRetry={() => { assignments.reload(); me.reload() }} />
  }

  return (
    <div className="w-full flex flex-col gap-4 pb-8">
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Today&rsquo;s Route</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            {stops.length ? `${stops.length} stop${stops.length === 1 ? '' : 's'} across ${active.length} active delivery${active.length === 1 ? '' : 's'}` : 'No active deliveries on your route.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={useMyLocation} disabled={locating}>
            {locating ? <Loader2 size={14} className="spin" /> : <LocateFixed size={14} />}
            {locating ? 'Locating…' : 'Use My Location'}
          </button>
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1.5" onClick={() => assignments.reload({ silent: true })}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {stops.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No route yet"
          message="Accept a delivery to build your route. Your pickup and drop-off stops will appear here in order, with a link you can open in Google Maps."
          action={<Link to="/delivery/pickups" className="btn btn-primary btn-sm">View Pickup Tasks</Link>}
        />
      ) : (
        <>
          {/* Route map panel */}
          <div className="card" style={{ padding: '18px 20px', margin: 0, border: '2px solid rgba(16, 185, 129, 0.25)' }}>
            {partnerPos && (
              <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: '#047857' }}>
                <span className="avatar" style={{ width: 30, height: 30, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <Navigation size={15} />
                </span>
                <div>
                  <div className="font-bold">Live location {livePos ? '(from your device)' : '(from profile)'}</div>
                  <div className="muted">{partnerPos.lat.toFixed(5)}, {partnerPos.lng.toFixed(5)}</div>
                </div>
                {rider.last_location_at && <span className="muted ml-auto">{formatDateTime(rider.last_location_at)}</span>}
              </div>
            )}

            <div className="flex flex-col" style={{ gap: 0 }}>
              {stops.map((s, i) => (
                <div className="flex" style={{ gap: 12 }} key={s.id}>
                  <div className="flex flex-col items-center" style={{ width: 22 }}>
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: s.type === 'pickup' ? '#4f46e5' : '#10b981',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: 9,
                        fontWeight: 800,
                      }}
                    >
                      {s.type === 'pickup' ? <Store size={10} /> : i}
                    </span>
                    {i < stops.length - 1 && (
                      <span style={{ width: 2, flex: 1, minHeight: 24, background: '#c7d2fe', borderLeft: '2px dashed #c7d2fe' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: stops.length - 1 === i ? 0 : 12, width: '100%' }}>
                    <div className="muted font-bold text-xs mb-0.5" style={{ color: s.type === 'pickup' ? '#4338ca' : '#059669' }}>
                      {s.type === 'pickup' ? 'PICKUP FROM VENDOR' : `DROP OFF ${i}`}
                    </div>
                    {s.assignment ? (
                      <div className="flex items-center justify-between wrap gap-2">
                        <div>
                          <div className="font-bold text-sm text-ink flex items-center gap-2">
                            {s.assignment.vendor_order_number || s.id}
                            <DeliveryStatusBadge status={s.assignment.status} size="xs" />
                          </div>
                          <div className="font-bold text-ink text-sm">{s.label}</div>
                          <div className="muted text-xs mt-0.5 flex items-center gap-1">
                            <MapPin size={11} color="#10b981" /> {s.address || '—'}
                          </div>
                          {s.assignment.recipient_phone && (
                            <a href={`tel:${s.assignment.recipient_phone}`} className="btn btn-ghost btn-xs text-success flex items-center gap-1" style={{ padding: '2px 6px', fontSize: 10 }}>
                              <Phone size={10} /> {s.assignment.recipient_phone}
                            </a>
                          )}
                          {s.assignment.cod_amount > 0 && (
                            <span className="chip chip-sm mt-1" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706', fontWeight: 800 }}>
                              Collect COD: {money(s.assignment.cod_amount)}
                            </span>
                          )}
                        </div>
                        <Link to={`/delivery/deliveries/${s.assignment.id}`} className="btn btn-outline btn-xs">
                          View
                        </Link>
                      </div>
                    ) : (
                      <div className="font-bold text-sm text-ink">{s.address || '—'}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between wrap gap-2 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <span className="muted text-xs">Open the whole route as turn-by-turn directions in Google Maps.</span>
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm flex items-center gap-1">
                  <ExternalLink size={14} /> Open in Maps
                </a>
              )}
            </div>
          </div>

          {/* Route summary cards */}
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div className="card flex items-center gap-3" style={{ padding: '14px 16px', margin: 0 }}>
              <span className="avatar" style={{ width: 38, height: 38, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                <Store size={18} />
              </span>
              <div>
                <div className="muted text-xs font-bold uppercase">Pickups</div>
                <div className="text-lg font-black text-ink">{active.filter((a) => a.status === 'assigned' || a.status === 'accepted').length}</div>
              </div>
            </div>
            <div className="card flex items-center gap-3" style={{ padding: '14px 16px', margin: 0 }}>
              <span className="avatar" style={{ width: 38, height: 38, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <MapPin size={18} />
              </span>
              <div>
                <div className="muted text-xs font-bold uppercase">Drop-offs</div>
                <div className="text-lg font-black text-ink">{active.length}</div>
              </div>
            </div>
            <div className="card flex items-center gap-3" style={{ padding: '14px 16px', margin: 0 }}>
              <span className="avatar" style={{ width: 38, height: 38, background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
                <Navigation size={18} />
              </span>
              <div>
                <div className="muted text-xs font-bold uppercase">Route Value</div>
                <div className="text-lg font-black" style={{ color: '#d97706' }}>
                  {money(active.reduce((s, a) => s + Number(a.cod_amount || 0) + Number(a.delivery_fee || 0), 0))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}