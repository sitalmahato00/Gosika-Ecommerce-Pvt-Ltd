import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  MapPin, Navigation, Compass, Layers, CheckCircle2,
  Sparkles, Crosshair, Search, Map as MapIcon, Globe
} from 'lucide-react'
import {
  NEPAL_PROVINCES,
  NEPAL_DISTRICTS_BY_PROVINCE,
  NEPAL_CITY_COORDINATES,
  NEPAL_POPULAR_LOCATIONS
} from '../../utils/constants'

// Normalize province string ('Koshi' -> 'Koshi Province')
export function normalizeProvince(p) {
  if (!p) return 'Bagmati Province'
  const trimmed = p.trim()
  if (trimmed.endsWith(' Province')) return trimmed
  const match = NEPAL_PROVINCES.find(np => np.toLowerCase().includes(trimmed.toLowerCase()))
  return match || `${trimmed} Province`
}

export function getDistrictsForProvince(prov) {
  const norm = normalizeProvince(prov)
  return NEPAL_DISTRICTS_BY_PROVINCE[norm] || NEPAL_DISTRICTS_BY_PROVINCE['Bagmati Province'] || []
}

export default function LocationMapPicker({
  value = {},
  onChange,
  showMap = true,
  compact = false,
  title = 'Delivery & Map Pinpoint Location',
  description = 'Pinpoint your exact delivery location on the map and confirm address details.',
  required = true,
}) {
  const initialProvince = normalizeProvince(value.province || 'Koshi Province')
  const initialDistricts = getDistrictsForProvince(initialProvince)
  const initialDistrict = value.district && initialDistricts.includes(value.district)
    ? value.district
    : initialDistricts[0] || 'Morang'

  const [province, setProvince] = useState(initialProvince)
  const [district, setDistrict] = useState(initialDistrict)
  const [municipality, setMunicipality] = useState(value.municipality || value.city || 'Biratnagar')
  const [streetAddress, setStreetAddress] = useState(value.street || value.address || value.street_address || 'Main Bazaar, Ward 4')
  const [landmark, setLandmark] = useState(value.landmark || '')
  const [coordinates, setCoordinates] = useState({
    lat: value.latitude || value.lat || 26.4525,
    lng: value.longitude || value.lng || 87.2718,
  })
  const [isLocating, setIsLocating] = useState(false)
  const [pinOffset, setPinOffset] = useState({ x: 50, y: 50 })

  // Synchronize when incoming parent props change
  const prevValueRef = useRef(value)
  useEffect(() => {
    if (value.province && value.province !== prevValueRef.current?.province) {
      const normP = normalizeProvince(value.province)
      setProvince(normP)
      const validDistricts = getDistrictsForProvince(normP)
      if (value.district && validDistricts.includes(value.district)) {
        setDistrict(value.district)
      } else {
        setDistrict(validDistricts[0] || 'Morang')
      }
    } else if (value.district && value.district !== prevValueRef.current?.district) {
      const validDistricts = getDistrictsForProvince(province)
      if (validDistricts.includes(value.district)) {
        setDistrict(value.district)
      }
    }

    if (value.municipality && value.municipality !== prevValueRef.current?.municipality) {
      setMunicipality(value.municipality)
    }
    if ((value.street || value.address) && (value.street || value.address) !== (prevValueRef.current?.street || prevValueRef.current?.address)) {
      setStreetAddress(value.street || value.address)
    }
    if (value.latitude && value.longitude && (value.latitude !== prevValueRef.current?.latitude || value.longitude !== prevValueRef.current?.longitude)) {
      setCoordinates({ lat: value.latitude, lng: value.longitude })
    }

    prevValueRef.current = value
  }, [value.province, value.district, value.municipality, value.street, value.address, value.latitude, value.longitude])

  // Get current districts for selected province
  const availableDistricts = useMemo(() => {
    return getDistrictsForProvince(province)
  }, [province])

  // Auto-correct district if current district is not in availableDistricts
  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.includes(district)) {
      setDistrict(availableDistricts[0])
    }
  }, [province, availableDistricts, district])

  // Notify parent of updates
  useEffect(() => {
    onChange?.({
      province,
      district,
      municipality,
      city: municipality,
      street: streetAddress,
      address: streetAddress,
      street_address: streetAddress,
      landmark,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      formatted_address: `${streetAddress ? streetAddress + ', ' : ''}${municipality ? municipality + ', ' : ''}${district ? district + ', ' : ''}${province}`,
    })
  }, [province, district, municipality, streetAddress, landmark, coordinates])

  // Handle Province selection
  const handleProvinceChange = (newProv) => {
    const normP = normalizeProvince(newProv)
    setProvince(normP)
    const validDists = getDistrictsForProvince(normP)
    const firstDist = validDists[0] || 'Morang'
    setDistrict(firstDist)

    // Center map around city of that province if known
    if (normP === 'Koshi Province') {
      setCoordinates({ lat: 26.4525, lng: 87.2718 })
      setMunicipality('Biratnagar')
    } else if (normP === 'Bagmati Province') {
      setCoordinates({ lat: 27.7172, lng: 85.3240 })
      setMunicipality('Kathmandu')
    } else if (normP === 'Gandaki Province') {
      setCoordinates({ lat: 28.2096, lng: 83.9856 })
      setMunicipality('Pokhara')
    } else if (normP === 'Lumbini Province') {
      setCoordinates({ lat: 27.7006, lng: 83.4484 })
      setMunicipality('Butwal')
    } else if (normP === 'Madhesh Province') {
      setCoordinates({ lat: 26.7288, lng: 85.9244 })
      setMunicipality('Janakpur')
    }
  }

  // Handle District selection
  const handleDistrictChange = (newDist) => {
    setDistrict(newDist)
    if (NEPAL_CITY_COORDINATES[newDist]) {
      const cityData = NEPAL_CITY_COORDINATES[newDist]
      setCoordinates({ lat: cityData.lat, lng: cityData.lng })
    }
  }

  // Handle GPS location
  const handleDetectLocation = () => {
    setIsLocating(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6))
          const lng = Number(pos.coords.longitude.toFixed(6))
          setCoordinates({ lat, lng })
          setIsLocating(false)
        },
        () => {
          setCoordinates({ lat: 27.7172, lng: 85.3240 })
          setIsLocating(false)
        },
        { timeout: 6000 }
      )
    } else {
      setIsLocating(false)
    }
  }

  // Handle 1-Click Quick Location Preset
  const handleApplyPreset = (preset) => {
    const normP = normalizeProvince(preset.province)
    setProvince(normP)
    setDistrict(preset.district)
    setMunicipality(preset.municipality)
    setStreetAddress(preset.address)
    setCoordinates({ lat: preset.lat, lng: preset.lng })
  }

  // Handle Map Click
  const handleMapClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPinOffset({ x: Math.max(5, Math.min(95, x)), y: Math.max(10, Math.min(90, y)) })

    const baseLat = coordinates.lat || 27.7172
    const baseLng = coordinates.lng || 85.3240
    const deltaLat = ((50 - y) / 1000).toFixed(6)
    const deltaLng = ((x - 50) / 1000).toFixed(6)
    setCoordinates({
      lat: Number((baseLat + Number(deltaLat)).toFixed(6)),
      lng: Number((baseLng + Number(deltaLng)).toFixed(6)),
    })
  }

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(coordinates.lng - 0.015).toFixed(4)}%2C${(coordinates.lat - 0.010).toFixed(4)}%2C${(coordinates.lng + 0.015).toFixed(4)}%2C${(coordinates.lat + 0.010).toFixed(4)}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`

  return (
    <div className="location-map-picker card card-pad-none" style={{ overflow: 'hidden', border: '1px solid var(--border)' }}>
      {/* Header */}
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
          disabled={isLocating}
          style={{ background: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <Navigation size={12} color="var(--primary)" />
          {isLocating ? 'Detecting GPS…' : 'Use My Current GPS Location'}
        </button>
      </div>

      {/* Interactive Map Section */}
      {showMap && (
        <div style={{ position: 'relative', height: 220, background: '#e2e8f0', overflow: 'hidden', cursor: 'crosshair' }} onClick={handleMapClick}>
          <iframe
            title="Nepal Delivery Location Map"
            src={osmEmbedUrl}
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          />

          {/* Floating Pin Marker */}
          <div
            style={{
              position: 'absolute',
              left: `${pinOffset.x}%`,
              top: `${pinOffset.y}%`,
              transform: 'translate(-50%, -100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none',
              transition: 'all 0.15s ease-out',
            }}
          >
            <div
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontWeight: 700,
                boxShadow: 'var(--shadow-md)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 2,
              }}
            >
              <MapPin size={12} /> Pinpoint Location
            </div>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'var(--primary)',
                border: '3px solid #fff',
                boxShadow: '0 0 12px var(--primary)',
              }}
            />
          </div>

          {/* Lat/Lng Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 10,
              left: 12,
              background: 'rgba(15, 23, 42, 0.85)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Compass size={12} color="#38bdf8" />
            <span>Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}</span>
            <span style={{ color: '#94a3b8' }}>· Click map to re-pin</span>
          </div>
        </div>
      )}

      {/* Quick Presets */}
      <div style={{ padding: '10px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
        <div className="muted text-xs font-semibold uppercase mb-1.5 flex items-center gap-1">
          <Sparkles size={11} color="var(--primary)" /> Popular Nepal Hubs & Quick Fill:
        </div>
        <div className="flex gap-1 wrap">
          {NEPAL_POPULAR_LOCATIONS.map((preset) => {
            const isSelected = province === preset.province && district === preset.district
            return (
              <button
                key={preset.name}
                type="button"
                className="btn btn-ghost btn-xs"
                style={{
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--primary-50)' : '#fff',
                  fontSize: 11,
                }}
                onClick={() => handleApplyPreset(preset)}
              >
                {preset.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Structured Cascading Address Fields */}
      <div style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {/* 1. Province Dropdown */}
          <div className="form-group">
            <label className="label text-xs font-bold">
              Province <span className="req">*</span>
            </label>
            <select
              className="select"
              required={required}
              value={province}
              onChange={(e) => handleProvinceChange(e.target.value)}
            >
              {NEPAL_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* 2. District Dropdown (Strictly Filtered by Province) */}
          <div className="form-group">
            <label className="label text-xs font-bold">
              District (in {province}) <span className="req">*</span>
            </label>
            <select
              className="select"
              required={required}
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
            >
              {availableDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* 3. Municipality / City */}
          <div className="form-group">
            <label className="label text-xs font-bold">
              Municipality / City <span className="req">*</span>
            </label>
            <input
              className="input"
              required={required}
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="e.g. Biratnagar, Pokhara, Kathmandu"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '2fr 1fr', gap: 12, marginTop: 12 }}>
          {/* 4. Street / Ward Address */}
          <div className="form-group">
            <label className="label text-xs font-bold">
              Street / Ward Address <span className="req">*</span>
            </label>
            <input
              className="input"
              required={required}
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="e.g. Main Bazaar Road, Ward 4"
            />
          </div>

          {/* 5. Landmark */}
          <div className="form-group">
            <label className="label text-xs font-bold">
              Nearby Landmark (Optional)
            </label>
            <input
              className="input"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Nepal Bank, Clock Tower"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
