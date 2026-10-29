import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Save, Pencil, ChevronRight, Percent, PackageCheck } from 'lucide-react'
import api from '../../api/client'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import StatusBadge from '../../components/commerce/StatusBadge'
import { useToast } from '../../context/ToastContext'
import { errorMessage } from '../../utils/format'

export default function VendorStoreSettings() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [vendor, setVendor] = useState(null)
  const [storeId, setStoreId] = useState(null)
  const [saving, setSaving] = useState('')
  const [storeForm, setStoreForm] = useState({ name: '', description: '', contact_email: '', contact_phone: '', status: '' })
  const [orderSettings, setOrderSettings] = useState({
    order_confirmation_mode: 'manual',
    auto_confirmation_minutes: 30,
    auto_ready_for_pickup: false,
    estimated_prep_time: '15 mins',
    pickup_instructions: '',
  })

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([api.get('/vendor/me'), api.get('/vendor/stores')])
      .then(([m, s]) => {
        const v = m.data.data || {}
        setVendor(v)
        const first = (s.data.data || [])[0]
        if (first) {
          setStoreId(first.id)
          setStoreForm({
            name: first.name || v.company_name || '',
            description: first.description || '',
            contact_email: first.contact_email || v.business_email || '',
            contact_phone: first.contact_phone || v.business_phone || '',
            status: first.status || '',
          })
          const st = first.settings || {}
          setOrderSettings({
            order_confirmation_mode: st.order_confirmation_mode || 'manual',
            auto_confirmation_minutes: Number(st.auto_confirmation_minutes) || 30,
            auto_ready_for_pickup: Boolean(st.auto_ready_for_pickup),
            estimated_prep_time: st.estimated_prep_time || '15 mins',
            pickup_instructions: st.pickup_instructions || '',
          })
        } else {
          setStoreId(null)
        }
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const saveStore = async (e) => {
    e.preventDefault()
    if (!storeId) return
    setSaving('store')
    try {
      await Promise.all([
        api.put(`/vendor/stores/${storeId}`, {
          name: storeForm.name,
          description: storeForm.description || undefined,
          contact_email: storeForm.contact_email || undefined,
          contact_phone: storeForm.contact_phone || undefined,
        }),
        api.put('/vendor/me', {
          company_name: storeForm.name,
          business_email: storeForm.contact_email,
          business_phone: storeForm.contact_phone,
        }).catch(() => {}),
      ])
      toast.success('Store details saved')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  const saveOrderSettings = async (e) => {
    e.preventDefault()
    if (!storeId) return
    setSaving('order_settings')
    try {
      await api.put(`/vendor/stores/${storeId}`, {
        name: storeForm.name,
        description: storeForm.description || undefined,
        contact_email: storeForm.contact_email || undefined,
        contact_phone: storeForm.contact_phone || undefined,
        settings: orderSettings,
      })
      toast.success('Order confirmation and fulfillment settings saved')
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving('')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4" style={{ paddingBottom: 40 }}>
        <Skeleton height={48} />
        <Skeleton height={260} />
        <Skeleton height={220} />
      </div>
    )
  }

  if (error) {
    return <ErrorState onRetry={load} />
  }

  return (
    <div style={{ width: '100%', paddingBottom: 40 }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Store Settings & Operations</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure your store profile information, order confirmation workflow, and delivery pickup rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/vendor/store/edit" className="btn btn-primary btn-sm flex items-center gap-1">
            <Pencil size={13} /> Edit Store Pictures & Branding <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* 1. Store Details & Contact Information */}
        <div className="card" style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-3 wrap gap-2">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
                <Store size={18} color="var(--primary)" /> Store Details & Contact Information
              </h3>
              <p className="muted text-xs" style={{ marginTop: 4 }}>
                Primary display name and customer support contact channels.
              </p>
            </div>
            <div className="flex items-center gap-2 wrap">
              {storeId && <StatusBadge status={storeForm.status || 'active'} />}
              <StatusBadge status={vendor?.status} />
              {vendor?.commission_rate != null && (
                <span className="chip chip-sm" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
                  <Percent size={11} /> {vendor.commission_rate}% commission
                </span>
              )}
            </div>
          </div>

          {storeId ? (
            <form onSubmit={saveStore} className="flex flex-col gap-3">
              <Input
                label="Store Display Name"
                required
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
              />
              <div className="form-row">
                <Input
                  label="Contact Email"
                  type="email"
                  required
                  value={storeForm.contact_email}
                  onChange={(e) => setStoreForm({ ...storeForm, contact_email: e.target.value })}
                />
                <Input
                  label="Customer Support Phone"
                  value={storeForm.contact_phone}
                  onChange={(e) => setStoreForm({ ...storeForm, contact_phone: e.target.value })}
                  placeholder="+977 98XXXXXXXX"
                />
              </div>
              <Textarea
                label="Store Description"
                rows={3}
                value={storeForm.description}
                onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                placeholder="A brief description of your store, specialty products, or brand story..."
              />
              <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Button type="submit" size="sm" disabled={saving === 'store'}>
                  {saving === 'store' ? <Spinner size={14} color="#fff" /> : <><Save size={13} /> Save Store Details</>}
                </Button>
              </div>
            </form>
          ) : (
            <div className="empty-state" style={{ padding: '28px 16px' }}>
              <div className="es-icon"><Store size={28} /></div>
              <p className="muted text-sm" style={{ margin: '0 auto 14px', maxWidth: 340 }}>
                You don't have a store yet. Create one to manage your storefront.
              </p>
              <Link to="/vendor/store/edit" className="btn btn-primary btn-sm">
                Create Store
              </Link>
            </div>
          )}
        </div>

        {/* 2. Order Confirmation & Fulfillment Operations */}
        {storeId && (
          <div className="card" style={{ padding: 20 }}>
            <div className="flex items-center justify-between mb-3 wrap gap-2">
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }} className="flex items-center gap-2">
                  <PackageCheck size={18} color="var(--primary)" /> Order Confirmation & Fulfillment Operations
                </h3>
                <p className="muted text-xs" style={{ marginTop: 4 }}>
                  Configure whether your store confirms orders automatically or manually, and setup fulfillment ready gates.
                </p>
              </div>
            </div>

            <form onSubmit={saveOrderSettings} className="flex flex-col gap-4">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                {/* Confirmation Mode */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--surface-subtle)' }}>
                  <label className="label" style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'block' }}>
                    Order Confirmation Setting
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors" style={{ border: '1px solid ' + (orderSettings.order_confirmation_mode === 'manual' ? 'var(--primary)' : 'var(--border)'), background: orderSettings.order_confirmation_mode === 'manual' ? 'rgba(255,85,0,0.04)' : '#fff' }}>
                      <input
                        type="radio"
                        name="order_confirmation_mode"
                        value="manual"
                        checked={orderSettings.order_confirmation_mode === 'manual'}
                        onChange={() => setOrderSettings({ ...orderSettings, order_confirmation_mode: 'manual' })}
                        style={{ marginTop: 3 }}
                      />
                      <div>
                        <div className="font-semibold text-sm">Manual Order Confirmation (Default)</div>
                        <div className="muted text-xs">Orders arrive as <strong>Pending</strong>. You must manually review and click <strong>Accept</strong> before preparation.</div>
                      </div>
                    </label>

                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded hover:bg-white transition-colors" style={{ border: '1px solid ' + (orderSettings.order_confirmation_mode === 'automatic' ? 'var(--primary)' : 'var(--border)'), background: orderSettings.order_confirmation_mode === 'automatic' ? 'rgba(255,85,0,0.04)' : '#fff' }}>
                      <input
                        type="radio"
                        name="order_confirmation_mode"
                        value="automatic"
                        checked={orderSettings.order_confirmation_mode === 'automatic'}
                        onChange={() => setOrderSettings({ ...orderSettings, order_confirmation_mode: 'automatic' })}
                        style={{ marginTop: 3 }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Automatic Order Confirmation</div>
                        <div className="muted text-xs">Orders are automatically confirmed after the customer cancellation window (15 mins) without manual approval.</div>

                        {orderSettings.order_confirmation_mode === 'automatic' && (
                          <div className="mt-3 pt-2.5" style={{ borderTop: '1px dashed var(--border)' }}>
                            <div className="text-xs font-bold uppercase mb-1.5" style={{ color: 'var(--muted)', letterSpacing: '0.04em' }}>
                              Auto-Confirmation Schedule
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {[
                                { value: 15, label: '15 mins (End of cancellation window)' },
                                { value: 30, label: '30 mins' },
                                { value: 60, label: '1 hour' },
                                { value: 120, label: '2 hours' },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`btn btn-xs ${Number(orderSettings.auto_confirmation_minutes) === opt.value ? 'btn-primary' : 'btn-outline'}`}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setOrderSettings({ ...orderSettings, auto_confirmation_minutes: opt.value })
                                  }}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <div className="muted text-xs mt-1.5">
                              Pending orders auto-confirm after this duration if not cancelled by buyer.
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>

                {/* Ready for Pickup Gate & Prep Time */}
                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16, background: 'var(--surface-subtle)' }}>
                  <label className="label" style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, display: 'block' }}>
                    Delivery Dispatch & Preparation
                  </label>
                  
                  <div className="flex flex-col gap-3">
                    <label className="flex items-start gap-2 cursor-pointer p-2 rounded bg-white" style={{ border: '1px solid var(--border)' }}>
                      <input
                        type="checkbox"
                        checked={orderSettings.auto_ready_for_pickup}
                        onChange={(e) => setOrderSettings({ ...orderSettings, auto_ready_for_pickup: e.target.checked })}
                        style={{ marginTop: 3 }}
                      />
                      <div>
                        <div className="font-semibold text-sm">Auto Ready for Pickup</div>
                        <div className="muted text-xs">Automatically mark confirmed orders as <strong>Ready for Pickup</strong> so delivery riders can claim them immediately.</div>
                      </div>
                    </label>

                    <div className="form-row">
                      <Input
                        label="Estimated Preparation Time"
                        placeholder="e.g. 15 mins, 1-2 Hours, Same Day"
                        value={orderSettings.estimated_prep_time}
                        onChange={(e) => setOrderSettings({ ...orderSettings, estimated_prep_time: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Textarea
                  label="Pickup Instructions for Delivery Riders"
                  rows={2}
                  placeholder="e.g. Ring warehouse doorbell at rear entrance. Ask for store manager at the pickup counter."
                  value={orderSettings.pickup_instructions}
                  onChange={(e) => setOrderSettings({ ...orderSettings, pickup_instructions: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <Button type="submit" size="sm" disabled={saving === 'order_settings'}>
                  {saving === 'order_settings' ? <Spinner size={14} color="#fff" /> : <><Save size={13} /> Save Order Settings</>}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
