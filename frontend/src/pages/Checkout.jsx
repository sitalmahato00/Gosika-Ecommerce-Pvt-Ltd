import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Plus, CreditCard, Banknote, Wallet, CheckCircle2,
  Lock, ArrowRight, ArrowLeft, ShieldCheck, ChevronRight
} from 'lucide-react'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { money, errorMessage, apiImage, getProductImage } from '../utils/format'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Textarea from '../components/ui/Textarea'
import Spinner from '../components/ui/Spinner'
import { Skeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import LocationMapPicker from '../components/common/LocationMapPicker'
import { NEPAL_PROVINCES } from '../utils/constants'

const STEPS = [
  { id: 1, label: 'Delivery Address' },
  { id: 2, label: 'Payment Method' },
  { id: 3, label: 'Review & Confirm' },
]

export default function Checkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { cart, loading: cartLoading } = useCart()
  const toast = useToast()

  const [summary, setSummary] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [step, setStep] = useState(1)
  const [shippingId, setShippingId] = useState('')
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [billingId, setBillingId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [notes, setNotes] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ label: '', name: '', phone: '', province: '', district: '', municipality: '', street: '', is_default: false })
  const [formSaving, setFormSaving] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    setLoading(true)
    Promise.all([
      api.get('/checkout/summary'),
      api.get('/customer/addresses'),
      api.get('/platform/config'),
    ])
      .then(([s, a, c]) => {
        setSummary(s.data.data)
        const list = a.data.data || a.data || []
        setAddresses(list)
        const def = list.find((x) => x.is_default) || list[0]
        if (def) {
          setShippingId(def.id)
          setBillingId(def.id)
        }
        setConfig(c.data.data)
        setPaymentMethod(c.data.data?.checkout?.cod_enabled ? 'cod' : 'khalti')
      })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [user])

  const codEnabled = config?.checkout?.cod_enabled ?? true
  const khaltiEnabled = config?.payment?.khalti_enabled ?? true
  const codMax = Number(config?.checkout?.cod_max_amount || 50000)
  const total = Number(summary?.total || 0)
  const codAllowed = codEnabled && total <= codMax

  const paymentOptions = useMemo(() => {
    const opts = []
    if (codEnabled) {
      opts.push({
        value: 'cod',
        label: 'Cash on Delivery (COD)',
        icon: Banknote,
        desc: 'Pay with cash upon arrival at your doorstep.',
        badge: 'Recommended',
        disabled: !codAllowed,
      })
    }
    if (khaltiEnabled) {
      opts.push({
        value: 'khalti',
        label: 'Khalti Digital Wallet',
        icon: CreditCard,
        desc: 'Instant online payment via Khalti mobile wallet / e-banking.',
        badge: 'Instant',
      })
    }
    return opts
  }, [codEnabled, khaltiEnabled, codAllowed])

  const saveAddress = async (e) => {
    e.preventDefault()
    setFormSaving(true)
    try {
      await api.post('/customer/addresses', form)
      const res = await api.get('/customer/addresses')
      const list = res.data.data || res.data || []
      setAddresses(list)
      const saved = list[0]
      if (saved) {
        setShippingId(saved.id)
        setBillingId(saved.id)
      }
      setAddOpen(false)
      setForm({ label: '', name: '', phone: '', province: '', district: '', municipality: '', street: '', is_default: false })
      toast.success('Address added successfully')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setFormSaving(false)
    }
  }

  const submitCheckout = async () => {
    setSubmitting(true)
    try {
      const res = await api.post('/checkout', {
        shipping_address_id: shippingId,
        billing_address_id: sameAsBilling ? null : billingId || shippingId,
        payment_method: paymentMethod,
      })
      const session = res.data.data
      const orderRes = await api.post('/orders', {
        checkout_session_id: session.id,
        customer_notes: notes || undefined,
      })
      const order = orderRes.data.data
      if (paymentMethod === 'khalti') {
        const payRes = await api.post('/payments/initiate', { order_id: order.id, method: 'khalti' })
        const payment = payRes.data.data
        if (payment?.payment_url) {
          window.open(payment.payment_url, '_blank', 'noopener')
          toast.info('Please complete payment in the opened tab.')
          navigate('/order-success', { state: { order, khalti: true, paymentId: payment.id } })
          return
        }
      }
      navigate('/order-success', { state: { order } })
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || cartLoading) {
    return (
      <div className="page-shell container">
        <Skeleton height={32} width={180} style={{ marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Skeleton height={80} />
            <Skeleton height={240} />
          </div>
          <Skeleton height={360} />
        </div>
      </div>
    )
  }

  if (!cart?.items?.length) {
    return (
      <div className="page-shell container">
        <EmptyState
          title="Your cart is empty"
          message="There are no items to checkout. Add some products to your cart first."
          action={<Link to="/shop" className="btn btn-primary">Start Shopping</Link>}
        />
      </div>
    )
  }

  const selectedAddress = addresses.find((a) => a.id === shippingId)

  return (
    <div className="page-shell container">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <Link to="/cart">Cart</Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Checkout</span>
      </nav>

      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Checkout</h1>

      {/* Stepper Header */}
      <div className="stepper" style={{ marginBottom: 28 }}>
        {STEPS.map((s) => (
          <React.Fragment key={s.id}>
            <div className={`step ${step === s.id ? 'active' : ''} ${step > s.id ? 'done' : ''}`}>
              <span className="step-num">{step > s.id ? <CheckCircle2 size={16} /> : s.id}</span>
              <span>{s.label}</span>
            </div>
            {s.id < 3 && <span className="step-divider" />}
          </React.Fragment>
        ))}
      </div>

      {/* Main 2-column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 28,
          alignItems: 'start',
        }}
        id="checkout-layout"
      >
        <style>{`
          @media (min-width: 960px) {
            #checkout-layout { grid-template-columns: minmax(0, 1fr) 360px !important; }
          }
        `}</style>

        {/* Left Column: Form Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* STEP 1: ADDRESS */}
          {step === 1 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ fontSize: 17, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} color="var(--primary)" /> Select Delivery Address
                </h2>
                <button className="btn btn-outline btn-sm" onClick={() => setAddOpen(true)}>
                  <Plus size={14} /> Add New Address
                </button>
              </div>

              {addresses.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className={`address-card ${shippingId === a.id ? 'selected' : ''}`}
                      onClick={() => { setShippingId(a.id); if (sameAsBilling) setBillingId(a.id) }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="shipping"
                            checked={shippingId === a.id}
                            onChange={() => { setShippingId(a.id); if (sameAsBilling) setBillingId(a.id) }}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          <span className="font-semibold" style={{ fontSize: 14 }}>{a.name}</span>
                          {a.label && <span className="chip chip-sm">{a.label}</span>}
                          {a.is_default && <span className="badge badge-primary">Default</span>}
                        </div>
                      </div>
                      <div className="muted text-sm" style={{ marginTop: 6, paddingLeft: 24 }}>
                        {a.street && `${a.street}, `}{a.municipality}, {a.district}, {a.province}
                      </div>
                      <div className="muted text-xs" style={{ marginTop: 4, paddingLeft: 24 }}>
                        Phone: <strong style={{ color: 'var(--ink)' }}>{a.phone}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <p className="muted text-sm mb-3">You don't have any saved delivery addresses yet.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
                    <Plus size={14} /> Add Delivery Address
                  </button>
                </div>
              )}

              <div className="checkbox-row" style={{ marginTop: 18 }}>
                <input
                  type="checkbox"
                  id="billingCheck"
                  checked={sameAsBilling}
                  onChange={() => setSameAsBilling(!sameAsBilling)}
                />
                <label htmlFor="billingCheck" style={{ cursor: 'pointer' }}>
                  Billing address is the same as delivery address
                </label>
              </div>

              {!sameAsBilling && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: 15, marginBottom: 12 }}>Select Billing Address</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {addresses.map((a) => (
                      <div
                        key={a.id}
                        className={`address-card ${billingId === a.id ? 'selected' : ''}`}
                        onClick={() => setBillingId(a.id)}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="billing"
                            checked={billingId === a.id}
                            onChange={() => setBillingId(a.id)}
                            style={{ accentColor: 'var(--primary)' }}
                          />
                          <span className="font-semibold">{a.name}</span>
                        </div>
                        <div className="muted text-xs" style={{ marginTop: 4, paddingLeft: 24 }}>
                          {a.municipality}, {a.district}, {a.province}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <Link to="/cart" className="btn btn-ghost btn-sm">
                  <ArrowLeft size={14} /> Back to Cart
                </Link>
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(2)}
                  disabled={!selectedAddress}
                >
                  Continue to Payment <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="card">
              <h2 style={{ fontSize: 17, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color="var(--primary)" /> Select Payment Method
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {paymentOptions.map((o) => (
                  <div
                    key={o.value}
                    className={`payment-method-card ${paymentMethod === o.value ? 'selected' : ''}`}
                    onClick={() => { if (!o.disabled) setPaymentMethod(o.value) }}
                    style={{ opacity: o.disabled ? 0.6 : 1, cursor: o.disabled ? 'not-allowed' : 'pointer' }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === o.value}
                      onChange={() => { if (!o.disabled) setPaymentMethod(o.value) }}
                      disabled={o.disabled}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div className="payment-method-icon">
                      <o.icon size={22} color="var(--primary)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ fontSize: 14 }}>{o.label}</span>
                        {o.badge && <span className="chip chip-sm">{o.badge}</span>}
                      </div>
                      <div className="muted text-xs" style={{ marginTop: 3 }}>{o.desc}</div>
                    </div>
                  </div>
                ))}

                {paymentMethod === 'cod' && !codAllowed && (
                  <div className="alert alert-warning" style={{ margin: 0 }}>
                    Cash on Delivery is limited to orders up to {money(codMax)}. Please use Khalti for this order.
                  </div>
                )}
              </div>

              <div style={{ marginTop: 20 }}>
                <label className="label">Order Notes / Delivery Instructions (optional)</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please call before arriving or leave with front desk…"
                />
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>
                  <ArrowLeft size={14} /> Back to Address
                </button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>
                  Review Order <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & CONFIRM */}
          {step === 3 && (
            <div className="card">
              <h2 style={{ fontSize: 17, marginBottom: 16 }}>Review & Confirm Order</h2>

              <div className="card" style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <span className="muted text-xs uppercase font-semibold">Delivery To</span>
                    <div className="font-semibold text-sm mt-1">{selectedAddress?.name}</div>
                    <div className="muted text-xs mt-1">
                      {selectedAddress?.street && `${selectedAddress.street}, `}{selectedAddress?.municipality}, {selectedAddress?.district}, {selectedAddress?.province}
                    </div>
                    <div className="muted text-xs mt-1">Phone: {selectedAddress?.phone}</div>
                  </div>
                  <div>
                    <span className="muted text-xs uppercase font-semibold">Payment Option</span>
                    <div className="font-semibold text-sm mt-1">
                      {paymentOptions.find((o) => o.value === paymentMethod)?.label || paymentMethod}
                    </div>
                    <div className="muted text-xs mt-1">
                      {paymentMethod === 'cod' ? 'Cash payment on delivery' : 'Online digital payment'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 4px' }}>
                <div className="flex justify-between py-1 text-sm">
                  <span className="muted">Subtotal ({cart.item_count} items)</span>
                  <span className="font-semibold">{money(summary?.subtotal || cart.subtotal)}</span>
                </div>
                {Number(summary?.discount) > 0 && (
                  <div className="flex justify-between py-1 text-sm">
                    <span className="muted">Promotional Discount</span>
                    <span className="text-success font-semibold">-{money(summary.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 text-sm">
                  <span className="muted">Delivery Charge</span>
                  <span className="font-semibold">
                    {Number(summary?.delivery_charge) > 0 ? money(summary.delivery_charge) : <span className="text-success">Free Delivery</span>}
                  </span>
                </div>
                <div className="flex justify-between py-1 text-sm">
                  <span className="muted">Tax</span>
                  <span className="font-semibold">{money(summary?.tax || 0)}</span>
                </div>
                <div className="flex justify-between items-center" style={{ borderTop: '2px solid var(--border)', paddingTop: 14, marginTop: 10 }}>
                  <span className="font-extrabold" style={{ fontSize: 16 }}>Grand Total</span>
                  <span className="price-current" style={{ fontSize: 24, color: 'var(--primary-darker)' }}>
                    {money(summary?.total || cart.subtotal)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>
                  <ArrowLeft size={14} /> Back
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={submitCheckout}
                  disabled={submitting}
                  style={{ minWidth: 200 }}
                >
                  {submitting ? (
                    <><Spinner size={16} color="#fff" /> Processing…</>
                  ) : (
                    <>Place Order ({money(summary?.total || cart.subtotal)}) <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Persistent Order Summary */}
        <div className="order-summary-panel">
          <div className="order-summary-header">
            Items in Order ({cart.item_count})
          </div>
          <div className="order-summary-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 280, overflowY: 'auto' }}>
              {cart.items.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 10, alignItems: 'center' }}>
                  <span className="thumb" style={{ width: 48, height: 48 }}>
                    <img
                      src={item.image ? apiImage(item.image) : getProductImage(item)}
                      alt=""
                      className="thumb-img"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80' }}
                    />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="truncate font-medium" style={{ fontSize: 13 }}>{item.name}</div>
                    <div className="muted text-xs">Qty: {item.quantity} · {money(item.unit_price)}</div>
                  </div>
                  <div className="font-semibold text-sm">{money(item.total_price)}</div>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div className="order-summary-row">
              <span className="muted text-sm">Subtotal</span>
              <span className="font-semibold">{money(summary?.subtotal || cart.subtotal)}</span>
            </div>
            <div className="order-summary-row">
              <span className="muted text-sm">Shipping</span>
              <span className="text-success font-semibold text-sm">
                {Number(summary?.delivery_charge) > 0 ? money(summary.delivery_charge) : 'Free'}
              </span>
            </div>
            <div className="order-summary-total">
              <span>Total</span>
              <span>{money(summary?.total || cart.subtotal)}</span>
            </div>

            <div className="flex items-center gap-1 justify-center muted text-xs mt-3">
              <Lock size={12} /> 256-Bit SSL Encrypted Checkout
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Delivery Address & Pin on Map" size="lg">
        <form onSubmit={saveAddress} className="flex flex-col gap-3">
          <div className="form-row">
            <Input label="Recipient Full Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aarav Shrestha" />
            <Input label="Mobile Phone (Nepal)" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" />
          </div>
          <Input label="Address Label (e.g. Home, Office)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Home" />

          {/* Interactive Map & Location Picker */}
          <LocationMapPicker
            value={{
              province: form.province,
              district: form.district,
              municipality: form.municipality,
              street: form.street,
            }}
            onChange={(loc) => {
              setForm((prev) => ({
                ...prev,
                province: loc.province,
                district: loc.district,
                municipality: loc.municipality,
                street: loc.street,
                latitude: loc.latitude,
                longitude: loc.longitude,
              }))
            }}
          />

          <div className="checkbox-row mb-2">
            <input type="checkbox" id="defAddr" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
            <label htmlFor="defAddr" style={{ cursor: 'pointer' }}>Set as default shipping address</label>
          </div>
          <Button type="submit" block disabled={formSaving}>
            {formSaving ? 'Saving Address…' : 'Save Delivery Address'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
