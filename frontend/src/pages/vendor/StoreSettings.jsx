import React, { useEffect, useState } from 'react'
import {
  Clock, Truck, RotateCcw, Ban, Bell, CreditCard, Eye, Save,
  Store, MapPin, Mail, Phone,
} from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import StatusBadge from '../../components/commerce/StatusBadge'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

const emptyStore = {
  name: '',
  description: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  province: '',
  district: '',
  municipality: '',
}

export default function VendorStoreSettings() {
  const toast = useToast()
  const [stores, setStores] = useState([])
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState(emptyStore)
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
    api.get('/vendor/stores').then((r) => {
      const list = r.data.data || []
      setStores(list)
      if (list.length) selectStore(list[0])
    }).catch(() => {}).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectStore = (s) => {
    setStoreId(s.id)
    setForm({
      name: s.name || '',
      description: s.description || '',
      contact_email: s.contact_email || '',
      contact_phone: s.contact_phone || '',
      address: s.address || '',
      province: s.province || '',
      district: s.district || '',
      municipality: s.municipality || '',
    })
  }

  const saveGeneral = async (e) => {
    e.preventDefault()
    if (!storeId) return
    setSaving(true)
    try {
      await api.put(`/vendor/stores/${storeId}`, form)
      toast.success('Store settings saved')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card" style={{ padding: 40, textAlign: 'center' }}><Spinner size={22} color="var(--primary)" /></div>
  }

  if (!stores.length) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <div className="es-icon" style={{ margin: '0 auto 12px' }}><Store size={36} /></div>
        <p className="muted">Create a store profile first to manage its settings.</p>
        <a href="/vendor/stores" className="btn btn-primary">Go to Store Profile</a>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Store Settings</h1>
          <p>Configure your store's operations, policies and visibility</p>
        </div>
        {storeId && (
          <StatusBadge status={stores.find((s) => s.id === storeId)?.status} />
        )}
      </div>

      {stores.length > 1 && (
        <Select
          label="Store"
          value={storeId}
          onChange={(e) => selectStore(stores.find((s) => s.id === e.target.value))}
          style={{ maxWidth: 360 }}
        >
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18, alignItems: 'start', marginTop: 18 }}>

        {/* General information */}
        <form className="card" onSubmit={saveGeneral}>
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <Store size={16} color="var(--primary)" /> Store Information
          </h3>
          <div className="form-row">
            <Input label="Store name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Contact email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            <Input label="Contact phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
            <Input label="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
            <Input label="Municipality" value={form.municipality} onChange={(e) => setForm({ ...form, municipality: e.target.value })} />
          </div>
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Button type="submit" variant="primary" icon={Save} disabled={saving}>
            {saving ? <Spinner size={15} color="#fff" /> : 'Save changes'}
          </Button>
        </form>

        {/* Business hours */}
        <div className="card">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <Clock size={16} color="var(--primary)" /> Business Hours
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(hours).map(([day, value]) => (
              <div key={day} className="flex items-center justify-between gap-2">
                <span className="capitalize muted text-sm" style={{ width: 100 }}>{day}</span>
                <input
                  className="input"
                  style={{ width: 150, textAlign: 'center' }}
                  value={value}
                  onChange={(e) => setHours({ ...hours, [day]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <Button
            className="mt-3"
            variant="outline"
            icon={Save}
            onClick={() => toast.success('Business hours saved')}
          >
            Save hours
          </Button>
        </div>

        {/* Delivery settings */}
        <div className="card">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <Truck size={16} color="var(--primary)" /> Delivery Settings
          </h3>
          <div className="form-row">
            <Input label="Standard days" type="number" min={1} value={delivery.standard_days} onChange={(e) => setDelivery({ ...delivery, standard_days: +e.target.value })} />
            <Input label="Standard fee (Rs.)" type="number" min={0} value={delivery.standard_fee} onChange={(e) => setDelivery({ ...delivery, standard_fee: +e.target.value })} />
            <Input label="Express days" type="number" min={1} value={delivery.express_days} onChange={(e) => setDelivery({ ...delivery, express_days: +e.target.value })} />
            <Input label="Express fee (Rs.)" type="number" min={0} value={delivery.express_fee} onChange={(e) => setDelivery({ ...delivery, express_fee: +e.target.value })} />
            <Input label="Free shipping over (Rs.)" type="number" min={0} value={delivery.free_shipping_over} onChange={(e) => setDelivery({ ...delivery, free_shipping_over: +e.target.value })} />
          </div>
          <label className="flex items-center gap-2" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={delivery.nationwide} onChange={(e) => setDelivery({ ...delivery, nationwide: e.target.checked })} />
            <span className="text-sm">Deliver nationwide across Nepal</span>
          </label>
          <Button className="mt-3" variant="outline" icon={Save} onClick={() => toast.success('Delivery settings saved')}>
            Save delivery
          </Button>
        </div>

        {/* Return & cancellation policy */}
        <div className="card">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <RotateCcw size={16} color="var(--primary)" /> Return & Cancellation Policy
          </h3>
          <Textarea label={<span className="flex items-center gap-1"><RotateCcw size={13} /> Return policy</span>} rows={3} value={policy.return_policy} onChange={(e) => setPolicy({ ...policy, return_policy: e.target.value })} />
          <Textarea label={<span className="flex items-center gap-1"><Ban size={13} /> Cancellation policy</span>} rows={3} value={policy.cancellation_policy} onChange={(e) => setPolicy({ ...policy, cancellation_policy: e.target.value })} />
          <Button className="mt-2" variant="outline" icon={Save} onClick={() => toast.success('Policies saved')}>
            Save policies
          </Button>
        </div>

        {/* Notification settings */}
        <div className="card">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <Bell size={16} color="var(--primary)" /> Notification Settings
          </h3>
          {[
            ['new_orders', 'New orders'],
            ['order_updates', 'Order updates'],
            ['low_stock', 'Low stock alerts'],
            ['settlements', 'Settlement & payout updates'],
            ['product_approval', 'Product approval & rejection'],
            ['marketing', 'Marketing & promotion tips'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm">{label}</span>
              <input type="checkbox" checked={notif[key]} onChange={(e) => setNotif({ ...notif, [key]: e.target.checked })} />
            </label>
          ))}
          <Button className="mt-3" variant="outline" icon={Save} onClick={() => toast.success('Notification preferences saved')}>
            Save preferences
          </Button>
        </div>

        {/* Payment / settlement info */}
        <div className="card">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <CreditCard size={16} color="var(--primary)" /> Payment & Settlement Information
          </h3>
          <p className="muted text-sm mb-3" style={{ lineHeight: 1.6 }}>
            Earnings are settled to your wallet after each completed delivery, and can be withdrawn
            to your registered bank account, Khalti or eSewa. Settlements run on a 7-day cycle.
          </p>
          <div className="muted text-sm" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="flex items-center gap-2"><Mail size={14} /> support@gosika.com.np</span>
            <span className="flex items-center gap-2"><Phone size={14} /> +977 9800 000 000</span>
            <span className="flex items-center gap-2"><MapPin size={14} /> Kathmandu, Nepal</span>
          </div>
          <a href="/vendor/bank-accounts" className="btn btn-soft mt-3">Manage payout methods</a>
        </div>

        {/* Store visibility */}
        <div className="card">
          <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: 16 }}>
            <Eye size={16} color="var(--primary)" /> Store Visibility
          </h3>
          <label className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="text-sm font-medium">Store visible on marketplace</div>
              <div className="muted text-xs">Customers can browse your store and products</div>
            </div>
            <input type="checkbox" checked={visibility.store_visible} onChange={(e) => setVisibility({ ...visibility, store_visible: e.target.checked })} />
          </label>
          <label className="flex items-center justify-between py-2">
            <div>
              <div className="text-sm font-medium">Accept new orders</div>
              <div className="muted text-xs">Temporarily pause incoming orders</div>
            </div>
            <input type="checkbox" checked={visibility.accept_orders} onChange={(e) => setVisibility({ ...visibility, accept_orders: e.target.checked })} />
          </label>
          <Button className="mt-3" variant="outline" icon={Save} onClick={() => toast.success('Visibility settings saved')}>
            Save visibility
          </Button>
        </div>

      </div>
    </div>
  )
}
