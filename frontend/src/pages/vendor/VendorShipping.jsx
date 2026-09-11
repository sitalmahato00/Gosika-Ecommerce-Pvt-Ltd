import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Warehouse, MapPin, Plus, Pencil, PackageCheck, Phone, Mail, Info
} from 'lucide-react'
import api from '../../api/client'
import StatusBadge from '../../components/commerce/StatusBadge'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { errorMessage } from '../../utils/format'

function addressLine(s) {
  return [
    s.street || s.street_address || s.address_line_1,
    s.municipality || s.city,
    s.district,
    s.province,
  ].filter(Boolean).join(', ') || 'Address not set yet'
}

export default function VendorShipping() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api.get('/vendor/stores')
      .then((r) => setLocations(r.data.data || []))
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Pickup Locations</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            The addresses where couriers pick up your parcels for delivery.
          </p>
        </div>
        <Link to="/vendor/store/edit" className="btn btn-primary btn-sm">
          <Plus size={14} /> Add Location
        </Link>
      </div>

      <div className="card" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Info size={17} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
        <p className="muted text-sm m-0">
          Pickup locations are built from your store addresses. Keep the address, contact phone and email on each
          store up to date so delivery partners can reach the right place. A parcel is ready for pickup once its
          order is marked <strong className="text-ink">Ready to Ship</strong> in Orders.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 50, textAlign: 'center' }}>
          <Spinner size={24} color="var(--primary)" />
        </div>
      ) : error ? (
        <EmptyState
          icon={Warehouse}
          title="Could not load pickup locations"
          message="Something went wrong while loading your pickup locations."
          action={<Button variant="outline" size="sm" onClick={load}>Try again</Button>}
        />
      ) : locations.length ? (
        <div className="flex flex-col gap-4">
          {locations.map((s, i) => (
            <div key={s.id} className="card card-pad-none" style={{ overflow: 'hidden' }}>
              <div className="flex items-center justify-between wrap gap-3" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <span className="avatar" style={{ width: 44, height: 44, background: 'var(--primary-50)', color: 'var(--primary)', flexShrink: 0 }}>
                    <Warehouse size={22} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 wrap">
                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{s.name}</h3>
                      {i === 0 && (
                        <span className="chip chip-sm" style={{ background: 'var(--primary-50)', color: 'var(--primary)', fontWeight: 700 }}>
                          Default Pickup Point
                        </span>
                      )}
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="muted text-xs mt-0.5">{s.slug ? `/${s.slug}` : s.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 wrap">
                  {s.status === 'active' && (
                    <Link to="/vendor/shipping/labels" className="btn btn-outline btn-sm">
                      <PackageCheck size={13} /> Print Labels
                    </Link>
                  )}
                  <Link to={`/vendor/store/edit`} className="btn btn-primary btn-sm">
                    <Pencil size={13} /> Edit Location
                  </Link>
                </div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--ink)', marginBottom: 8 }}>
                  <MapPin size={15} color="var(--primary)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{addressLine(s)}</span>
                </div>
                <div className="muted text-xs flex items-center gap-4 wrap">
                  {s.contact_phone && <span className="flex items-center gap-1"><Phone size={12} /> {s.contact_phone}</span>}
                  {s.contact_email && <span className="flex items-center gap-1"><Mail size={12} /> {s.contact_email}</span>}
                  {s.pickup_hours && <span className="flex items-center gap-1"><PackageCheck size={12} /> Pickup: {s.pickup_hours}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Warehouse}
          title="No pickup locations yet"
          message="Add a store address to set up your first pickup point for courier collection."
          action={<Link to="/vendor/store/edit" className="btn btn-primary"><Plus size={14} /> Add Location</Link>}
        />
      )}
    </div>
  )
}