import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  MapPin, Navigation, Compass, Crosshair, Sparkles, Loader2
} from 'lucide-react'
import api from '../../api/client'
import {
  NEPAL_PROVINCES,
  getDistrictsForProvince,
  getMunicipalitiesForDistrict,
  reverseGeocodeLocal,
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

export default function LocationMapPicker({
  value = {},
  onChange,
  showMap = true,
  compact = false,
  title = 'Delivery & Map Pinpoint Location',
  description = 'Pinpoint your exact delivery location on the map and confirm address details.',
  required = true,
}) {
  const findMunicipality = (munis, name) => {
    if (!name || !munis.length) return munis[0]?.name || ''
    return munis.find(m => m.name === name)
      || munis.find(m => m.name.toLowerCase().includes(name.toLowerCase()))
      || munis.find(m => name.toLowerCase().includes(m.name.toLowerCase()))
      || munis[0]?.name || ''
  }

  const resolveLocation = (lat, lng) => {
    const match = reverseGeocodeLocal(lat, lng)
    if (!match) return null
    const normP = normalizeProvince(match.province)
    const dists = getDistrictsForProvince(normP)
    const dist = dists.includes(match.district) ? match.district : dists[0] || ''
    const munis = getMunicipalitiesForDistrict(dist, normP)
    return {
      province: normP,
      district: dist,
      municipality: findMunicipality(munis, match.municipality),
    }
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

  const getCoordsForProvince = (prov) => {
    const capitalName = PROVINCE_CAPITALS[prov]
    if (capitalName && NEPAL_CITY_COORDINATES[capitalName]) {
      const c = NEPAL_CITY_COORDINATES[capitalName]
      return { lat: c.lat, lng: c.lng }
    }
    return { lat: 27.7172, lng: 85.3240 }
  }

  const getInitialLocation = () => {
    if (value.province && value.district) {
      const normP = normalizeProvince(value.province)
      const dists = getDistrictsForProvince(normP)
      const dist = dists.includes(value.district) ? value.district : dists[0] || ''
      const munis = getMunicipalitiesForDistrict(dist, normP)
      const muni = value.municipality && munis.some(m => m.name === value.municipality)
        ? value.municipality
        : munis[0]?.name || ''
      return { province: normP, district: dist, municipality: muni }
    }
    if (value.latitude && value.longitude) {
      const resolved = resolveLocation(value.latitude, value.longitude)
      if (resolved) return resolved
    }
    const normP = NEPAL_PROVINCES[0] || 'Bagmati Province'
    const dists = getDistrictsForProvince(normP)
    const dist = dists[0] || ''
    const munis = getMunicipalitiesForDistrict(dist, normP)
    return { province: normP, district: dist, municipality: munis[0]?.name || '' }
  }

  const init = getInitialLocation()

  const defaultLat = value.latitude || value.lat || getCoordsForProvince(init.province).lat
  const defaultLng = value.longitude || value.lng || getCoordsForProvince(init.province).lng

  const [province, setProvince] = useState(init.province)
  const [district, setDistrict] = useState(init.district)
  const [municipality, setMunicipality] = useState(init.municipality)
  const [streetAddress, setStreetAddress] = useState(value.street || value.address || value.street_address || '')
  const [landmark, setLandmark] = useState(value.landmark || '')
  const [coordinates, setCoordinates] = useState({ lat: defaultLat, lng: defaultLng })
  const [isLocating, setIsLocating] = useState(false)
  const [resolvingGeo, setResolvingGeo] = useState(false)
  const [pinOffset, setPinOffset] = useState({ x: 50, y: 50 })
  const prevValueRef = useRef(value)

  useEffect(() => {
    if (value.province && value.province !== prevValueRef.current?.province) {
      const normP = normalizeProvince(value.province)
      setProvince(normP)
      const validDistricts = getDistrictsForProvince(normP)
      if (value.district && validDistricts.includes(value.district)) {
        setDistrict(value.district)
      } else {
        setDistrict(validDistricts[0] || '')
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

  const availableDistricts = useMemo(() => getDistrictsForProvince(province), [province])
  const availableMunicipalities = useMemo(() => getMunicipalitiesForDistrict(district, province), [district, province])

  useEffect(() => {
    if (availableDistricts.length > 0 && !availableDistricts.includes(district)) {
      setDistrict(availableDistricts[0])
    }
  }, [province, availableDistricts, district])

  useEffect(() => {
    if (availableMunicipalities.length > 0 && !availableMunicipalities.some(m => m.name === municipality)) {
      setMunicipality(availableMunicipalities[0]?.name || '')
    }
  }, [district, availableMunicipalities, municipality])

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

  const handleProvinceChange = (newProv) => {
    const normP = normalizeProvince(newProv)
    setProvince(normP)
    const validDists = getDistrictsForProvince(normP)
    const firstDist = validDists[0] || ''
    setDistrict(firstDist)
    const munis = getMunicipalitiesForDistrict(firstDist, normP)
    setMunicipality(munis[0]?.name || '')
    const capitalName = PROVINCE_CAPITALS[normP]
    if (capitalName && NEPAL_CITY_COORDINATES[capitalName]) {
      const c = NEPAL_CITY_COORDINATES[capitalName]
      setCoordinates({ lat: c.lat, lng: c.lng })
    }
  }

  const findCityCoordsForDistrict = (dist) => {
    const districtCityMap = {
      'Kathmandu': 'Kathmandu', 'Lalitpur': 'Lalitpur', 'Bhaktapur': 'Bhaktapur',
      'Kaski': 'Pokhara', 'Morang': 'Biratnagar', 'Sunsari': 'Dharan',
      'Chitwan': 'Bharatpur', 'Rupandehi': 'Butwal', 'Kailali': 'Dhangadhi',
      'Banke': 'Nepalgunj', 'Parsa': 'Birgunj', 'Makwanpur': 'Hetauda',
      'Dhanusha': 'Janakpur',
    }
    const cityName = districtCityMap[dist]
    return cityName ? NEPAL_CITY_COORDINATES[cityName] : null
  }

  const handleDistrictChange = (newDist) => {
    setDistrict(newDist)
    const munis = getMunicipalitiesForDistrict(newDist, province)
    setMunicipality(munis[0]?.name || '')
    const coords = findCityCoordsForDistrict(newDist)
    if (coords) setCoordinates({ lat: coords.lat, lng: coords.lng })
  }

  const handleDetectLocation = () => {
    setIsLocating(true)
    setResolvingGeo(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6))
          const lng = Number(pos.coords.longitude.toFixed(6))
          setCoordinates({ lat, lng })
          try {
            const res = await api.get('/platform/geo/reverse-geocode', { params: { lat, lng } })
            const geo = res.data?.data
            if (geo?.province?.name) setProvince(geo.province.name)
            if (geo?.district?.name) setDistrict(geo.district.name)
            if (geo?.municipality?.name) setMunicipality(geo.municipality.name)
          } catch {
            const resolved = resolveLocation(lat, lng)
            if (resolved) {
              setProvince(resolved.province)
              setDistrict(resolved.district)
              setMunicipality(resolved.municipality)
            }
          }
          setIsLocating(false)
          setResolvingGeo(false)
        },
        () => {
          setCoordinates({ lat: 27.7172, lng: 85.3240 })
          setIsLocating(false)
          setResolvingGeo(false)
        },
        { timeout: 10000 }
      )
    } else {
      setIsLocating(false)
      setResolvingGeo(false)
    }
  }

  const handleApplyPreset = (preset) => {
    const normP = normalizeProvince(preset.province)
    setProvince(normP)
    setDistrict(preset.district)
    setMunicipality(preset.municipality)
    setStreetAddress(preset.address)
    setCoordinates({ lat: preset.lat, lng: preset.lng })
  }

  const handleMapClick = (e) => {
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
    const resolved = resolveLocation(newLat, newLng)
    if (resolved) {
      setProvince(resolved.province)
      setDistrict(resolved.district)
      setMunicipality(resolved.municipality)
    }
  }

  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${(coordinates.lng - 0.015).toFixed(4)}%2C${(coordinates.lat - 0.010).toFixed(4)}%2C${(coordinates.lng + 0.015).toFixed(4)}%2C${(coordinates.lat + 0.010).toFixed(4)}&layer=mapnik&marker=${coordinates.lat}%2C${coordinates.lng}`

  return (
    <div className="location-map-picker card card-pad-none" style={{ overflow: 'hidden', border: '1px solid var(--border)' }}>
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
          {resolvingGeo ? <Loader2 size={12} className="spin" /> : <Navigation size={12} color="var(--primary)" />}
          {isLocating ? 'Detecting GPS…' : 'Use My GPS Location'}
        </button>
      </div>

      {showMap && (
        <div style={{ position: 'relative', height: 220, background: '#e2e8f0', overflow: 'hidden', cursor: 'crosshair' }} onClick={handleMapClick}>
          <iframe
            title="Nepal Delivery Location Map"
            src={osmEmbedUrl}
            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
          />
          <div style={{ position: 'absolute', left: `${pinOffset.x}%`, top: `${pinOffset.y}%`, transform: 'translate(-50%, -100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none', transition: 'all 0.15s ease-out' }}>
            <div style={{ background: 'var(--primary)', color: '#fff', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 700, boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <MapPin size={12} /> Pinpoint Location
            </div>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', border: '3px solid #fff', boxShadow: '0 0 12px var(--primary)' }} />
          </div>
          <div style={{ position: 'absolute', bottom: 10, left: 12, background: 'rgba(15, 23, 42, 0.85)', color: '#fff', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-sm)' }}>
            <Compass size={12} color="#38bdf8" />
            <span>Lat: {coordinates.lat.toFixed(4)}, Lng: {coordinates.lng.toFixed(4)}</span>
            <span style={{ color: '#94a3b8' }}>· Click map to re-pin</span>
          </div>
        </div>
      )}

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
                style={{ border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)', background: isSelected ? 'var(--primary-50)' : '#fff', fontSize: 11 }}
                onClick={() => handleApplyPreset(preset)}
              >
                {preset.name}
              </button>
            )
          })}
        </div>
      </div>

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
            <select className="select" required={required} value={municipality} onChange={(e) => setMunicipality(e.target.value)}>
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
            <input className="input" required={required} value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="e.g. Main Bazaar Road, Ward 4" />
          </div>
          <div className="form-group">
            <label className="label text-xs font-bold">Nearby Landmark</label>
            <input className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Near Nepal Bank, Clock Tower" />
          </div>
        </div>
      </div>
    </div>
  )
}
