import React, { useMemo, useState } from 'react'
import {
  MapPin, Store, Navigation, ExternalLink, Compass,
  Truck, CheckCircle2, AlertCircle, Copy, Layers
} from 'lucide-react'
import { NEPAL_CITY_COORDINATES } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'

/**
 * Helper to extract coordinates from text if explicit coords are not supplied.
 * Checks for known Nepal cities/hubs.
 */
function resolveCoordsFromAddress(address) {
  if (!address || typeof address !== 'string') return null
  const lower = address.toLowerCase()
  for (const [city, coords] of Object.entries(NEPAL_CITY_COORDINATES)) {
    if (lower.includes(city.toLowerCase())) {
      return { lat: coords.lat, lng: coords.lng, source: city }
    }
  }
  return null
}

export default function DeliveryRouteMap({
  pickup,              // { name, address, lat, lng } or string address
  dropoff,             // { name, address, phone, lat, lng } or string address
  rider,               // { name, phone, lat, lng }
  tracking = [],       // array of tracking events
  status = 'assigned', // current delivery status
  height = 340,
  title = 'Map-Based Delivery Route',
  subtitle = 'Live visual delivery corridor and GPS navigation',
  showDirectionsBtn = true,
  className = '',
  style = {},
}) {
  const toast = useToast()
  const [mapLayer, setMapLayer] = useState('mapnik') // 'mapnik'
  const [isCopied, setIsCopied] = useState(false)

  // 1. Normalize Pickup Point
  const pickupPoint = useMemo(() => {
    const rawAddress = typeof pickup === 'string' ? pickup : pickup?.address || ''
    const rawName = typeof pickup === 'object' ? pickup?.name : ''
    let lat = typeof pickup === 'object' ? Number(pickup?.lat) : NaN
    let lng = typeof pickup === 'object' ? Number(pickup?.lng) : NaN

    if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
      const fallback = resolveCoordsFromAddress(rawAddress)
      lat = fallback?.lat || 27.7172 // default Kathmandu
      lng = fallback?.lng || 85.3240
    }

    return {
      name: rawName || 'Merchant Store (Pickup)',
      address: rawAddress || 'Store Pickup Location',
      lat,
      lng,
    }
  }, [pickup])

  // 2. Normalize Dropoff Point
  const dropoffPoint = useMemo(() => {
    const rawAddress = typeof dropoff === 'string' ? dropoff : dropoff?.address || ''
    const rawName = typeof dropoff === 'object' ? dropoff?.name : ''
    const rawPhone = typeof dropoff === 'object' ? dropoff?.phone : ''
    let lat = typeof dropoff === 'object' ? Number(dropoff?.lat) : NaN
    let lng = typeof dropoff === 'object' ? Number(dropoff?.lng) : NaN

    if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
      const fallback = resolveCoordsFromAddress(rawAddress)
      // Slight offset if same as pickup so bbox doesn't collapse
      lat = fallback?.lat || (pickupPoint.lat + 0.015)
      lng = fallback?.lng || (pickupPoint.lng + 0.015)
    }

    return {
      name: rawName || 'Customer Dropoff',
      phone: rawPhone,
      address: rawAddress || 'Customer Delivery Address',
      lat,
      lng,
    }
  }, [dropoff, pickupPoint])

  // 3. Current Rider Location
  const riderPoint = useMemo(() => {
    let lat = Number(rider?.lat)
    let lng = Number(rider?.lng)

    // Check latest tracking update if rider lat/lng not provided
    if (isNaN(lat) || isNaN(lng) || !lat || !lng) {
      const latestWithCoords = [...tracking].reverse().find(t => t.latitude && t.longitude)
      if (latestWithCoords) {
        lat = Number(latestWithCoords.latitude)
        lng = Number(latestWithCoords.longitude)
      }
    }

    if (!isNaN(lat) && !isNaN(lng) && lat && lng) {
      return {
        name: rider?.name || 'Assigned Courier Rider',
        phone: rider?.phone,
        lat,
        lng,
      }
    }

    // Interpolate midpoint if out for delivery
    if (status === 'out_for_delivery') {
      return {
        name: rider?.name || 'Assigned Courier Rider',
        phone: rider?.phone,
        lat: (pickupPoint.lat + dropoffPoint.lat) / 2,
        lng: (pickupPoint.lng + dropoffPoint.lng) / 2,
        isEstimated: true,
      }
    }

    return null
  }, [rider, tracking, status, pickupPoint, dropoffPoint])

  // 4. Calculate Bounding Box
  const bbox = useMemo(() => {
    const points = [
      { lat: pickupPoint.lat, lng: pickupPoint.lng },
      { lat: dropoffPoint.lat, lng: dropoffPoint.lng },
    ]
    if (riderPoint) {
      points.push({ lat: riderPoint.lat, lng: riderPoint.lng })
    }

    const lats = points.map(p => p.lat)
    const lngs = points.map(p => p.lng)

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    const latDelta = Math.max(0.01, (maxLat - minLat) * 0.4)
    const lngDelta = Math.max(0.01, (maxLng - minLng) * 0.4)

    return {
      minLng: (minLng - lngDelta).toFixed(4),
      minLat: (minLat - latDelta).toFixed(4),
      maxLng: (maxLng + lngDelta).toFixed(4),
      maxLat: (maxLat + latDelta).toFixed(4),
      centerLat: ((minLat + maxLat) / 2).toFixed(6),
      centerLng: ((minLng + maxLng) / 2).toFixed(6),
    }
  }, [pickupPoint, dropoffPoint, riderPoint])

  // Center marker on rider if out for delivery, else destination
  const activeMarker = riderPoint || (status === 'delivered' ? dropoffPoint : pickupPoint)

  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.minLng}%2C${bbox.minLat}%2C${bbox.maxLng}%2C${bbox.maxLat}&layer=${mapLayer}&marker=${activeMarker.lat}%2C${activeMarker.lng}`

  // Google Maps directions navigation URL
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickupPoint.lat + ',' + pickupPoint.lng)}&destination=${encodeURIComponent(dropoffPoint.lat + ',' + dropoffPoint.lng)}&travelmode=driving`

  const copyCoordinates = () => {
    const text = `Pickup: ${pickupPoint.lat}, ${pickupPoint.lng} | Delivery: ${dropoffPoint.lat}, ${dropoffPoint.lng}`
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    toast.success('Route GPS coordinates copied!')
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div
      className={`card card-pad-none ${className}`}
      style={{
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: '0 4px 20px -4px rgba(15,23,42,0.08)',
        borderRadius: 14,
        background: 'var(--surface)',
        ...style,
      }}
    >
      {/* Header bar */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(255, 85, 0, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Compass size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{title}</div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>{subtitle}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={copyCoordinates}
            title="Copy Coordinates"
            style={{ fontSize: 11, padding: '4px 8px' }}
          >
            <Copy size={12} /> {isCopied ? 'Copied' : 'GPS Coords'}
          </button>

          {showDirectionsBtn && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-xs"
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
              }}
            >
              <Navigation size={12} /> Open in Google Maps <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Map Canvas / Embed */}
      <div style={{ position: 'relative', width: '100%', height, background: '#e2e8f0' }}>
        <iframe
          title="Delivery Route Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={osmUrl}
          style={{ border: 0, display: 'block' }}
        />

        {/* Floating Route Waypoint Indicator Pills */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none',
            flexWrap: 'wrap',
            gap: 8,
          }}
        >
          {/* Pickup Pin Pill */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              maxWidth: 220,
              fontSize: 11.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 800, color: '#4338ca' }}>
              <Store size={12} /> Pickup: {pickupPoint.name}
            </div>
            <div style={{ color: '#475569', fontSize: 10.5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pickupPoint.address}
            </div>
          </div>

          {/* Delivery Pin Pill */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '6px 10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              maxWidth: 220,
              fontSize: 11.5,
              textAlign: 'right',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, fontWeight: 800, color: '#059669' }}>
              <MapPin size={12} /> Dropoff: {dropoffPoint.name}
            </div>
            <div style={{ color: '#475569', fontSize: 10.5, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dropoffPoint.address}
            </div>
          </div>
        </div>

        {/* Live Rider Beacon Overlay when out for delivery */}
        {(status === 'out_for_delivery' || status === 'picked_up') && (
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#fff',
              backdropFilter: 'blur(8px)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 11.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.4)',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <span>Rider In Transit · Corridor Active</span>
          </div>
        )}
      </div>

      {/* Corridor Waypoints Card Footer */}
      <div
        style={{
          padding: '12px 18px',
          background: '#f8fafc',
          borderTop: '1px solid var(--border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          fontSize: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#e0e7ff',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            1
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Seller Warehouse</div>
            <div style={{ color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pickupPoint.address}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: status === 'out_for_delivery' ? '#fef3c7' : '#f1f5f9',
              color: status === 'out_for_delivery' ? '#d97706' : '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            <Truck size={12} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Transit Corridor</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>
              {status === 'delivered' ? 'Completed' : status === 'out_for_delivery' ? 'On Highway / Way' : 'Dispatched'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: status === 'delivered' ? '#d1fae5' : '#fee2e2',
              color: status === 'delivered' ? '#059669' : '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            3
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Customer Doorstep</div>
            <div style={{ color: '#64748b', fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dropoffPoint.address}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
