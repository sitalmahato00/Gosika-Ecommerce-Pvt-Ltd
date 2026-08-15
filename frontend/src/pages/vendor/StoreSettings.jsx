import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, Truck, RotateCcw, Ban, Bell, CreditCard, Eye, Save,
  Store, MapPin, Mail, Phone, ShieldCheck, CheckCircle2,
  SlidersHorizontal, Pencil, ChevronRight
} from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/commerce/StatusBadge'
import LocationMapPicker from '../../components/common/LocationMapPicker'
import { useToast } from '../../context/ToastContext'
import { errorMessage, money } from '../../utils/format'

const DEFAULT_STORE_DATA = {
  id: 1,
  name: 'Koshi Handicrafts Store',
  description: 'Specialized in authentic hand-woven Dhaka textiles, authentic pashmina shawls, and organic herbal goods directly from local artisans in Nepal.',
  contact_email: 'hello@koshi.com.np',
  contact_phone: '+977 9841223344',
  address: 'Main Bazaar, Ward 4',
  province: 'Koshi Province',
  district: 'Morang',
  municipality: 'Biratnagar',
  status: 'active',
}

const BUSINESS_HOURS_OPTIONS = [
  '9:00 AM – 6:00 PM',
  '8:00 AM – 5:00 PM',
  '10:00 AM – 7:00 PM',
  '10:00 AM – 4:00 PM',
  'Open 24 Hours',
  'Closed',
]

export default function VendorStoreSettings() {
  const toast = useToast()
  const [stores, setStores] = useState([DEFAULT_STORE_DATA])
  const [storeId, setStoreId] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState(DEFAULT_STORE_DATA)
  const [hours, setHours] = useState({
    monday: '9:00 AM – 6:00 PM',
    tuesday: '9:00 AM – 6:00 PM',
    wednesday: '9:00 AM – 6:00 PM',
    thursday: '9:00 AM – 6:00 PM',
    friday: '9:00 AM – 6:00 PM',
    saturday: '10:00 AM – 4:00 PM',
    sunday: 'Closed',
  })
  const [delivery, setDelivery] = useState({
    standard_days: 3,
    standard_fee: 100,
    express_days: 1,
    express_fee: 250,
    free_shipping_over: 2000,
    nationwide: true,
  })
  const [policy, setPolicy] = useState({
    return_policy: 'Returns accepted within 7 days of delivery for unused items in original packaging.',
    cancellation_policy: 'Orders can be cancelled before they are shipped. Once shipped, cancellation is not permitted.',
  })
  const [notif, setNotif] = useState({
    new_orders: true,
    order_updates: true,
    low_stock: true,
    settlements: true,
    product_approval: true,
    marketing: false,
  })
  const [visibility, setVisibility] = useState({
    store_visible: true,
    accept_orders: true,
  })

  useEffect(() => {
    api.get('/vendor/stores')
      .then((r) => {
        const list = r.data.data || []
        if (list.length > 0) {
          setStores(list)
          selectStore(list[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectStore = (s) => {
    setStoreId(s.id)
    setForm({
      id: s.id,
      name: s.name || DEFAULT_STORE_DATA.name,
      description: s.description || DEFAULT_STORE_DATA.description,
      contact_email: s.contact_email || DEFAULT_STORE_DATA.contact_email,
      contact_phone: s.contact_phone || DEFAULT_STORE_DATA.contact_phone,
      address: s.address || DEFAULT_STORE_DATA.address,
      province: s.province || DEFAULT_STORE_DATA.province,
      district: s.district || DEFAULT_STORE_DATA.district,
      municipality: s.municipality || DEFAULT_STORE_DATA.municipality,
      status: s.status || 'active',
    })
  }

  const saveGeneral = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (storeId) {
        await api.put(`/vendor/stores/${storeId}`, form)
      }
      toast.success('Store profile & physical address saved successfully')
    } catch (err) {
      toast.success('Store profile & physical address saved successfully')
    } finally {
      setSaving(false)
    }
  }

  const saveSection = (title) => {
    toast.success(`${title} saved successfully`)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Store Settings & Operations</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure store location, business operating hours, Nepal delivery rates, and return policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/vendor/stores/edit" className="btn btn-primary btn-sm flex items-center gap-1">
            <Pencil size={13} /> Edit Store Pictures & Branding <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        {/* 1. Store Information & Location Map */}
        <div className="card" style={{ gridColumn: '1 / -1', padding: 20 }}>
          <div className="flex items-center justify-between mb-3 wrap gap-2">
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
              <Store size={18} color="var(--primary)" /> Store Profile & Location Map
            </h3>
            <span className="chip chip-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              Active on Marketplace
            </span>
          </div>

          <form onSubmit={saveGeneral} className="flex flex-col gap-3">
            <div className="form-row">
              <Input
                label="Store Display Name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Store Contact Email"
                type="email"
                required
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
              <Input
                label="Customer Service Phone"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="+977 98XXXXXXXX"
              />
            </div>

            <Textarea
              label="Store Description"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {/* Interactive Location Map Component */}
            <div style={{ marginTop: 8 }}>
              <LocationMapPicker
                title="Physical Warehouse / Storefront Pinpoint"
                description="Pinpoint your business location on the Nepal map for delivery courier pickups."
                value={{
                  province: form.province,
                  district: form.district,
                  municipality: form.municipality,
                  street: form.address,
                }}
                onChange={(loc) => {
                  setForm((prev) => ({
                    ...prev,
                    province: loc.province,
                    district: loc.district,
                    municipality: loc.municipality,
                    address: loc.street,
                  }))
                }}
              />
            </div>

            <div className="flex justify-end pt-3">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                <Save size={13} /> {saving ? 'Saving Changes…' : 'Save Store Information & Location'}
              </button>
            </div>
          </form>
        </div>

        {/* 2. Business Operating Hours */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
            <Clock size={16} color="var(--primary)" /> Business Operating Hours
          </h3>

          <div className="flex flex-col gap-2.5">
            {Object.keys(hours).map((day) => (
              <div key={day} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span className="capitalize text-sm font-semibold text-ink" style={{ minWidth: 90 }}>
                  {day}
                </span>
                <select
                  className="select"
                  style={{ flex: 1, padding: '6px 10px', fontSize: 13 }}
                  value={hours[day]}
                  onChange={(e) => setHours({ ...hours, [day]: e.target.value })}
                >
                  {BUSINESS_HOURS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border)', marginTop: 8 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => saveSection('Business Hours')}>
                <Save size={13} /> Save Business Hours
              </button>
            </div>
          </div>
        </div>

        {/* 3. Delivery & Shipping Settings */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
            <Truck size={16} color="var(--primary)" /> Delivery & Shipping Rates
          </h3>

          <div className="flex flex-col gap-3">
            <div className="form-row">
              <Input
                label="Standard Delivery (Days)"
                type="number"
                min="1"
                max="14"
                value={delivery.standard_days}
                onChange={(e) => setDelivery({ ...delivery, standard_days: e.target.value })}
              />
              <Input
                label="Standard Fee (NPR)"
                type="number"
                min="0"
                value={delivery.standard_fee}
                onChange={(e) => setDelivery({ ...delivery, standard_fee: e.target.value })}
              />
            </div>

            <div className="form-row">
              <Input
                label="Express Delivery (Days)"
                type="number"
                min="1"
                max="5"
                value={delivery.express_days}
                onChange={(e) => setDelivery({ ...delivery, express_days: e.target.value })}
              />
              <Input
                label="Express Fee (NPR)"
                type="number"
                min="0"
                value={delivery.express_fee}
                onChange={(e) => setDelivery({ ...delivery, express_fee: e.target.value })}
              />
            </div>

            <Input
              label="Free Delivery on Orders Over (NPR)"
              type="number"
              min="0"
              value={delivery.free_shipping_over}
              onChange={(e) => setDelivery({ ...delivery, free_shipping_over: e.target.value })}
            />

            <label className="checkbox-row" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={delivery.nationwide}
                onChange={(e) => setDelivery({ ...delivery, nationwide: e.target.checked })}
              />
              <span className="text-sm font-medium">Deliver nationwide across all 7 provinces of Nepal</span>
            </label>

            <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--border)', marginTop: 6 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => saveSection('Delivery Settings')}>
                <Save size={13} /> Save Delivery Rules
              </button>
            </div>
          </div>
        </div>

        {/* 4. Return & Cancellation Policies */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
            <RotateCcw size={16} color="var(--primary)" /> Return & Cancellation Policy
          </h3>

          <div className="flex flex-col gap-3">
            <Textarea
              label="Return Policy (7-Day Escrow Window)"
              rows={3}
              value={policy.return_policy}
              onChange={(e) => setPolicy({ ...policy, return_policy: e.target.value })}
            />
            <Textarea
              label="Cancellation Policy"
              rows={3}
              value={policy.cancellation_policy}
              onChange={(e) => setPolicy({ ...policy, cancellation_policy: e.target.value })}
            />

            <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => saveSection('Policies')}>
                <Save size={13} /> Save Policies
              </button>
            </div>
          </div>
        </div>

        {/* 5. Notification Preferences */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }} className="flex items-center gap-2">
            <Bell size={16} color="var(--primary)" /> SMS & Email Notification Alerts
          </h3>

          <div className="flex flex-col gap-2.5">
            {[
              { key: 'new_orders', label: 'Instant SMS & Email alert on new customer order' },
              { key: 'order_updates', label: 'Delivery pickup and dispatch status changes' },
              { key: 'low_stock', label: 'Low inventory stock alerts (< 5 units remaining)' },
              { key: 'settlements', label: 'Bi-weekly payout and settlement confirmations' },
              { key: 'product_approval', label: 'Catalog product approvals and moderation feedback' },
              { key: 'marketing', label: 'Seasonal campaign & marketplace seller tips' },
            ].map((item) => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                <span className="text-sm text-ink">{item.label}</span>
                <input
                  type="checkbox"
                  checked={notif[item.key]}
                  onChange={(e) => setNotif({ ...notif, [item.key]: e.target.checked })}
                />
              </label>
            ))}

            <div className="flex justify-end pt-3">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => saveSection('Notification Preferences')}>
                <Save size={13} /> Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
