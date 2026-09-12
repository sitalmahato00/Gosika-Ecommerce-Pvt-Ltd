import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  MapPin, Navigation, Compass, Sparkles, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react'
import api from '../../api/client'
import {
  NEPAL_PROVINCES,
  getDistrictsForProvince,
  getMunicipalitiesForDistrict,
  reverseGeocodeLocal,
  matchNepalLocation,
} from '../../utils/nepalLocations'
import { NEPAL_POPULAR_LOCATIONS, NEPAL_CITY_COORDINATES } from '../../utils/constants'

export function normalizeProvince(p) {
  if (!p) return ''
  const trimmed = p.trim()
  if (trimmed.endsWith(' Province')) return trimmed
  const match = NEPAL_PROVINCES.find(np => np.toLowerCase().includes(trimmed.toLowerCase()))
  return match || `${trimmed} Province`
}

export function getDistrictsForProvinceExport(prov) {
  const norm = normalizeProvince(prov)
  return getDistrictsForProvince(norm)
}

const PROVINCE_CAPITALS = {
  'Koshi Province': 'Biratnagar',
  'Madhesh Province': 'Janakpur',
  'Bagmati Province': 'Kathmandu',
  'Gandaki Province': 'Pokhara',
  'Lumbini Province': 'Butwal',
  'Karnali Province': 'Nepalgunj',
  'Sudurpashchim Province': 'Dhangadhi',
}

const DISTRICT_COORDS_MAP = {
  'Kathmandu': 'Kathmandu', 'Lalitpur': 'Lalitpur', 'Bhaktapur': 'Bhaktapur',
  'Kaski': 'Pokhara', 'Morang': 'Biratnagar', 'Sunsari': 'Dharan',
  'Chitwan': 'Bharatpur', 'Rupandehi': 'Butwal', 'Kailali': 'Dhangadhi',
  'Banke': 'Nepalgunj', 'Parsa': 'Birgunj', 'Makwanpur': 'Hetauda',
  'Dhanusa': 'Janakpur',
}

export default function LocationMapPicker({
  value,
  province: propProvince,
  district: propDistrict,
  municipality: propMunicipality,
  city: propCity,
  street: propStreet,
  address: propAddress,
  landmark: propLandmark,
  latitude: propLatitude,
  longitude: propLongitude,
  coordinates: propCoordinates,
  onChange,
  showMap = true,
  compact = false,
  title = 'Delivery & Map Pinpoint Location',
  description = 'Pinpoint your exact delivery location on the map and confirm address details.',
  required = true,
}) {
  const initialProv = normalizeProvince(value?.province || propProvince) || 'Bagmati Province'
  const initialDist = value?.district || propDistrict || getDistrictsForProvince(initialProv)[0] || 'Kathmandu'
  const initialMuni = value?.municipality || propMunicipality || propCity || getMunicipalitiesForDistrict(initialDist, initialProv)[0]?.name || ''
  const initialStreet = value?.street || value?.street_address || value?.address || propStreet || propAddress || ''
  const initialLandmark = value?.landmark || propLandmark || ''
  const initialLat = Number(value?.latitude || propLatitude || propCoordinates?.lat || NEPAL_CITY_COORDINATES[PROVINCE_CAPITALS[initialProv]]?.lat || 27.7172)
  const initialLng = Number(value?.longitude || propLongitude || propCoordinates?.lng || NEPAL_CITY_COORDINATES[PROVINCE_CAPITALS[initialProv]]?.lng || 85.3240)

  const [province, setProvince] = useState(initialProv)
  const [district, setDistrict] = useState(initialDist)
  const [municipality, setMunicipality] = useState(initialMuni)
  const [streetAddress, setStreetAddress] = useState(initialStreet)
  const [landmark, setLandmark] = useState(initialLandmark)
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng })
  const [isLocating, setIsLocating] = useState(false)
  const [resolvingGeo, setResolvingGeo] = useState(false)
  const [geoStatus, setGeoStatus] = useState('')
  const [pinOffset, setPinOffset] = useState({ x: 50, y: 50 })

  const lastEmittedRef = useRef('')

  // Sync from props if external value changes
  useEffect(() => {
    const nextProv = normalizeProvince(value?.province || propProvince)
    const nextDist = value?.district || propDistrict
    const nextMuni = value?.municipality || propMunicipality || propCity
    const nextStreet = value?.street || value?.street_address || value?.address || propStreet || propAddress
    const nextLandmark = value?.landmark || propLandmark
    const nextLat = value?.latitude || propLatitude || propCoordinates?.lat
    const nextLng = value?.longitude || propLongitude || propCoordinates?.lng

    if (nextProv && nextProv !== province) setProvince(nextProv)
    if (nextDist && nextDist !== district) setDistrict(nextDist)
    if (nextMuni && nextMuni !== municipality) setMunicipality(nextMuni)
    if (nextStreet !== undefined && nextStreet !== streetAddress) setStreetAddress(nextStreet)
    if (nextLandmark !== undefined && nextLandmark !== landmark) setLandmark(nextLandmark)
    if (nextLat && nextLng && (Number(nextLat) !== coordinates.lat || Number(nextLng) !== coordinates.lng)) {
      setCoordinates({ lat: Number(nextLat), lng: Number(nextLng) })
    }
  }, [
    value?.province, value?.district, value?.municipality, value?.street, value?.address, value?.latitude, value?.longitude, value?.landmark,
    propProvince, propDistrict, propMunicipality, propCity, propStreet, propAddress, propLandmark, propLatitude, propLongitude, propCoordinates
  ])

  const availableDistricts = useMemo(() => getDistrictsForProvince(province), [province])
  const availableMunicipalities = useMemo(() => getMunicipalitiesForDistrict(district, province), [district, province])

  // Emit changes to parent
  const emitChange = useCallback((data) => {
    const payload = {
      province: data.province !== undefined ? data.province : province,
      district: data.district !== undefined ? data.district : district,
      municipality: data.municipality !== undefined ? data.municipality : municipality,
      city: data.municipality !== undefined ? data.municipality : municipality,
      street: data.street !== undefined ? data.street : streetAddress,
      address: data.street !== undefined ? data.street : streetAddress,
      street_address: data.street !== undefined ? data.street : streetAddress,
      landmark: data.landmark !== undefined ? data.landmark : landmark,
      latitude: data.lat !== undefined ? data.lat : coordinates.lat,
      longitude: data.lng !== undefined ? data.lng : coordinates.lng,
      coordinates: {
        lat: data.lat !== undefined ? data.lat : coordinates.lat,
        lng: data.lng !== undefined ? data.lng : coordinates.lng,
      },
      formatted_address: [
        data.street !== undefined ? data.street : streetAddress,
        data.municipality !== undefined ? data.municipality : municipality,
        data.district !== undefined ? data.district : district,
        data.province !== undefined ? data.province : province,
      ].filter(Boolean).join(', '),
    }

    const sig = JSON.stringify(payload)
    if (sig !== lastEmittedRef.current) {
      lastEmittedRef.current = sig
      onChange?.(payload)
    }
  }, [province, district, municipality, streetAddress, landmark, coordinates, onChange])

  // Apply reverse geocoded data smoothly and atomically
  const applyResolvedLocation = (geo, lat, lng) => {
    if (!geo) return

    let nextProv = province
    let nextDist = district
    let nextMuni = municipality
    let nextStreet = streetAddress

    // 1. Province
    if (geo.province?.name || geo.province) {
      nextProv = normalizeProvince(geo.province?.name || geo.province)
      setProvince(nextProv)
    }

    // 2. District
    const validDists = getDistrictsForProvince(nextProv)
    const rawDist = geo.district?.name || geo.district || ''
    if (rawDist) {
      const match = validDists.find(d => d.toLowerCase() === rawDist.toLowerCase() || d.toLowerCase().includes(rawDist.toLowerCase()))
      nextDist = match || rawDist
      setDistrict(nextDist)
    }

    // 3. Municipality
    const validMunis = getMunicipalitiesForDistrict(nextDist, nextProv)
    const rawMuni = geo.municipality?.name || geo.municipality || ''
    if (rawMuni) {
      const cleanRaw = rawMuni.replace(/\s+(rural municipality|municipality|metropolitan city|sub-metropolitan city)$/i, '').trim().toLowerCase()
      const match = validMunis.find(m => m.name.toLowerCase() === rawMuni.toLowerCase() || m.name.toLowerCase().includes(cleanRaw) || cleanRaw.includes(m.name.toLowerCase()))
      nextMuni = match ? match.name : rawMuni
      setMunicipality(nextMuni)
    } else if (validMunis.length > 0 && !validMunis.some(m => m.name === nextMuni)) {
      nextMuni = validMunis[0].name
      setMunicipality(nextMuni)
    }

    // 4. Street / Ward Address
    if (geo.address_line || geo.street) {
      nextStreet = geo.address_line || geo.street
      setStreetAddress(nextStreet)
    }

    if (lat && lng) {
      setCoordinates({ lat, lng })
    }

    const statusText = [nextMuni, nextDist, nextProv].filter(Boolean).join(', ')
    setGeoStatus(`📍 Detected: ${statusText}`)

    emitChange({
      province: nextProv,
      district: nextDist,
      municipality: nextMuni,
      street: nextStreet,
      lat: lat || coordinates.lat,
      lng: lng || coordinates.lng,
    })
  }

  // Reverse Geocoding Core Handler
  const performReverseGeocode = async (lat, lng) => {
    setResolvingGeo(true)
    setGeoStatus('Resolving location details…')

    try {
      // 1. Try Backend API
      const res = await api.get('/platform/geo/reverse-geocode', { params: { lat, lng } })
      if (res.data?.data) {
        applyResolvedLocation(res.data.data, lat, lng)
        return
      }
    } catch {
      // Backend failed or errored, try direct Nominatim
    }

    try {
      // 2. Direct OpenStreetMap Nominatim
      const osmRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`, {
        headers: { 'Accept': 'application/json' },
      })
      if (osmRes.ok) {
        const osmData = await osmRes.json()
        if (osmData?.address) {
          const matched = matchNepalLocation(osmData.address)
          if (matched) {
            applyResolvedLocation(matched, lat, lng)
            return
          }
        }
      }
    } catch {
      // Direct OSM failed, try local geometry
    }

    // 3. Fallback to Local Coordinate Matrix
    const local = reverseGeocodeLocal(lat, lng)
    if (local) {
      applyResolvedLocation(local, lat, lng)
    } else {
      setGeoStatus('')
    }
  }

  const handleProvinceChange = (newProv) => {
    const normP = normalizeProvince(newProv)
    setProvince(normP)
    const validDists = getDistrictsForProvince(normP)
    const firstDist = validDists[0] || ''
    setDistrict(firstDist)
    const munis = getMunicipalitiesForDistrict(firstDist, normP)
    const firstMuni = munis[0]?.name || ''
    setMunicipality(firstMuni)

    const capitalName = PROVINCE_CAPITALS[normP]
    let newCoords = coordinates
    if (capitalName && NEPAL_CITY_COORDINATES[capitalName]) {
      const c = NEPAL_CITY_COORDINATES[capitalName]
      newCoords = { lat: c.lat, lng: c.lng }
      setCoordinates(newCoords)
      setPinOffset({ x: 50, y: 50 })
    }

    setGeoStatus('')
    emitChange({
      province: normP,
      district: firstDist,
      municipality: firstMuni,
      lat: newCoords.lat,
      lng: newCoords.lng,
    })
  }

  const handleDistrictChange = (newDist) => {
    setDistrict(newDist)
    const munis = getMunicipalitiesForDistrict(newDist, province)
    const firstMuni = munis[0]?.name || ''
    setMunicipality(firstMuni)

    const cityName = DISTRICT_COORDS_MAP[newDist]
    let newCoords = coordinates
    if (cityName && NEPAL_CITY_COORDINATES[cityName]) {
      const c = NEPAL_CITY_COORDINATES[cityName]
      newCoords = { lat: c.lat, lng: c.lng }
      setCoordinates(newCoords)
      setPinOffset({ x: 50, y: 50 })
    }

    setGeoStatus('')
    emitChange({
      province,
      district: newDist,
      municipality: firstMuni,
      lat: newCoords.lat,
      lng: newCoords.lng,
    })
  }

  const handleMunicipalityChange = (newMuni) => {
    setMunicipality(newMuni)
    setGeoStatus('')
    emitChange({ municipality: newMuni })
  }

  const handleStreetChange = (newStreet) => {
    setStreetAddress(newStreet)
    emitChange({ street: newStreet })
  }

  const handleLandmarkChange = (newLandmark) => {
    setLandmark(newLandmark)
    emitChange({ landmark: newLandmark })
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    setResolvingGeo(true)
    setGeoStatus('Detecting GPS location…')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6))
        const lng = Number(pos.coords.longitude.toFixed(6))
        setCoordinates({ lat, lng })
        setPinOffset({ x: 50, y: 50 })
        await performReverseGeocode(lat, lng)
        setIsLocating(false)
        setResolvingGeo(false)
      },
      (err) => {
        console.warn('GPS detection failed, falling back to default:', err)
        setCoordinates({ lat: 27.7172, lng: 85.3240 })
        setIsLocating(false)
        setResolvingGeo(false)
        setGeoStatus('GPS detection failed. Please select your location on the map or dropdowns.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleApplyPreset = (preset) => {
    const normP = normalizeProvince(preset.province)
    setProvince(normP)
    setDistrict(preset.district)
    setMunicipality(preset.municipality)
    setStreetAddress(preset.address || '')
    setCoordinates({ lat: preset.lat, lng: preset.lng })
    setPinOffset({ x: 50, y: 50 })
    setGeoStatus(`📍 Selected: ${preset.name}`)

    emitChange({
      province: normP,
      district: preset.district,
      municipality: preset.municipality,
      street: preset.address || '',
      lat: preset.lat,
      lng: preset.lng,
    })
  }

  const handleMapClick = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPinOffset({ x: Math.max(5, Math.min(95, x)), y: Math.max(10, Math.min(90, y)) })

    const baseLat = coordinates.lat || 27.7172
    const baseLng = coordinates.lng || 85.3240
    const deltaLat = ((50 - y) / 1000).toFixed(6)
    const deltaLng = ((x - 50) / 1000).toFixed(6)
    const newLat = Number((baseLat + Number(deltaLat)).toFixed(6))
    const newLng = Number((baseLng + Number(deltaLng)).toFixed(6))

    setCoordinates({ lat: newLat, lng: newLng })
    await performReverseGeocode(newLat, newLng)
    setResolvingGeo(false)
  }

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(coordinates.lng - 0.015).toFixed(4)}%2C${(coordinates.lat - 0.010).toFixed(4)}%2C${(coordinates.lng + 0.015).toFixed(4)}%2C${(coordinates.lat + 0.010).toFixed(4)}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`

  return (
    <div className="location-map-picker card card-pad-none" style={{ overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {/* Header bar */}
      <div style={{ padding: '14px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} color="var(--primary)" /> {title}
          </div>
          {description && <div className="muted text-xs mt-0.5">{description}</div>}
        </div>
        <button
          type="button"
          className="btn btn-outline btn-xs"
          onClick={handleDetectLocation}
          disabled={isLocating || resolvingGeo}
          style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: 6, cursor: (isLocating || resolvingGeo) ? 'wait' : 'pointer', fontWeight: 600 }}
        >
          {(isLocating || resolvingGeo) ? (
            <Loader2 size={13} className="spin" style={{ color: 'var(--primary)', animation: 'spin 0.75s linear infinite' }} />
          ) : (
            <Navigation size={12} color="var(--primary)" />
          )}
          {isLocating ? 'Detecting GPS…' : resolvingGeo ? 'Resolving…' : 'Use My GPS Location'}
        </button>
      </div>

      {/* Map View */}
      {showMap && (
        <div style={{ position: 'relative', height: 220, background: '#e2e8f0', overflow: 'hidden', cursor: 'crosshair' }} onClick={handleMapClick}>
          {(isLocating || resolvingGeo) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(2px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                gap: 8,
              }}
            >
              <Loader2 size={30} className="spin" style={{ color: 'var(--primary)', animation: 'spin 0.75s linear infinite' }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                {isLocating ? 'Detecting GPS Location…' : 'Resolving Address Details…'}
              </div>
            </div>
          )}

          <iframe
            title="Nepal Delivery Location Map"
            src={osmEmbedUrl}
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          />
          {/* Custom Floating Pin */}
          <div style={{ position: 'absolute', left: `${pinOffset.x}%`, top: `${pinOffset.y}%`, transform: 'translate(-50%, -100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', transition: 'all 0.15s ease-out' }}>
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 700, boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <MapPin size={12} /> Pinpoint Location
            </div>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', border: '3px solid #fff', boxShadow: '0 0 12px var(--primary)' }} />
          </div>
          {/* Bottom Lat/Lng & status info badge */}
          <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(15, 23, 42, 0.88)', color: '#fff', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap' }}>
            <Compass size={12} color="#38bdf8" />
            <span>Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}</span>
            <span style={{ color: '#94a3b8' }}>· Click anywhere to re-pin & auto-fill</span>
          </div>
        </div>
      )}

      {/* Geolocation status pill */}
      {geoStatus && (
        <div
          style={{
            padding: '9px 18px',
            background: (isLocating || resolvingGeo) ? '#eff6ff' : geoStatus.includes('failed') ? '#fef2f2' : 'var(--primary-50)',
            borderBottom: '1px solid var(--border)',
            fontSize: 12.5,
            color: (isLocating || resolvingGeo) ? '#1d4ed8' : geoStatus.includes('failed') ? '#dc2626' : 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
          }}
        >
          {(isLocating || resolvingGeo) ? (
            <Loader2 size={14} className="spin" style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }} />
          ) : geoStatus.includes('failed') ? (
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
          )}
          <span>{geoStatus}</span>
        </div>
      )}

      {/* Popular Nepal Hubs Presets */}
      <div style={{ padding: '10px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="muted text-xs font-semibold uppercase mb-1.5 flex items-center gap-1">
          <Sparkles size={11} color="var(--primary)" /> Popular Nepal Hubs:
        </div>
        <div className="flex gap-1 wrap">
          {NEPAL_POPULAR_LOCATIONS.map((preset) => {
            const isSelected = province === preset.province && district === preset.district
            return (
              <button
                key={preset.name}
                type="button"
                className="btn btn-ghost btn-xs"
                style={{ border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)', background: isSelected ? 'var(--primary-50)' : '#fff', fontSize: 11, cursor: 'pointer' }}
                onClick={() => handleApplyPreset(preset)}
              >
                {preset.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cascading Location Selectors */}
      <div style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label className="label text-xs font-bold">Province <span className="req">*</span></label>
            <select className="select" required={required} value={province} onChange={(e) => handleProvinceChange(e.target.value)}>
              <option value="">Select Province</option>
              {NEPAL_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label text-xs font-bold">District <span className="req">*</span></label>
            <select className="select" required={required} value={district} onChange={(e) => handleDistrictChange(e.target.value)}>
              <option value="">Select District</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="label text-xs font-bold">Municipality / VDC <span className="req">*</span></label>
            <select className="select" required={required} value={municipality} onChange={(e) => handleMunicipalityChange(e.target.value)}>
              <option value="">Select Municipality</option>
              {availableMunicipalities.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '2fr 1fr', gap: 12, marginTop: 12 }}>
          <div className="form-group">
            <label className="label text-xs font-bold">Street / Ward Address <span className="req">*</span></label>
            <input
              className="input"
              required={required}
              value={streetAddress}
              onChange={(e) => handleStreetChange(e.target.value)}
              placeholder="e.g. Main Bazaar Road, Ward 4"
            />
          </div>
          <div className="form-group">
            <label className="label text-xs font-bold">Nearby Landmark</label>
            <input
              className="input"
              value={landmark}
              onChange={(e) => handleLandmarkChange(e.target.value)}
              placeholder="e.g. Near Nepal Bank, Clock Tower"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
