import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  MapPin, Plus, CreditCard, Banknote, CheckCircle2,
  Lock, ArrowRight, ArrowLeft, ChevronRight, Wallet
} from 'lucide-react'
import api from '../api/client'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { money, errorMessage, apiImage, getProductImage, handleImgError } from '../utils/format'
import { PAYMENT_BRAND_LOGOS } from '../utils/constants'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import { Skeleton } from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import LocationMapPicker from '../components/common/LocationMapPicker'
import { getDistrictsForProvince, getMunicipalitiesForDistrict } from '../utils/nepalLocations'

const STEPS = [
  { id: 1, label: 'Delivery Address' },
  { id: 2, label: 'Payment Method' },
  { id: 3, label: 'Review & Confirm' },
]

export default function Checkout() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { cart, loading: cartLoading, fetchCart } = useCart()
  const toast = useToast()

  const selectedItemIds = useMemo(() => {
    if (location.state?.selectedItemIds && Array.isArray(location.state.selectedItemIds) && location.state.selectedItemIds.length > 0) {
      return location.state.selectedItemIds
    }
    // If buyNow, resolve item from cart.items matching productId & variantId
    if (location.state?.buyNow && location.state?.productId && cart?.items?.length) {
      const match = cart.items.find((i) =>
        (i.product_id === location.state.productId || i.product?.id === location.state.productId) &&
        (location.state.variantId ? (i.variant_id === location.state.variantId || i.variant?.id === location.state.variantId) : true)
      )
      if (match) return [match.id]
    }
    if (location.state?.buyNow) {
      return []
    }
    try {
      const saved = localStorage.getItem('gosika_selected_cart_items')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return null
  }, [location.state?.selectedItemIds, location.state?.buyNow, location.state?.productId, location.state?.variantId, cart?.items])

  const checkoutItems = useMemo(() => {
    if (!cart?.items) return []
    if (selectedItemIds && selectedItemIds.length > 0) {
      return cart.items.filter((i) => selectedItemIds.includes(i.id))
    }
    if (location.state?.buyNow) {
      return []
    }
    return cart.items
  }, [cart?.items, selectedItemIds, location.state?.buyNow])

  const itemsSubtotal = useMemo(() => {
    return checkoutItems.reduce((sum, i) => sum + Number(i.total_price || 0), 0)
  }, [checkoutItems])

  const itemsKey = useMemo(() => {
    return selectedItemIds?.length ? selectedItemIds.slice().sort().join(',') : ''
  }, [selectedItemIds])

  const [summary, setSummary] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [config, setConfig] = useState(null)
  const [provinces, setProvinces] = useState([])
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
    const summaryParams = itemsKey ? { items: itemsKey } : {}
    Promise.all([
      api.get('/checkout/summary', { params: summaryParams }),
      api.get('/customer/addresses'),
      api.get('/platform/config'),
      api.get('/platform/provinces'),
    ])
      .then(([s, a, c, p]) => {
        setSummary(s.data.data)
        const list = a.data.data || a.data || []
        setAddresses(list)
        const def = list.find((x) => x.is_default) || list[0]
        if (def) {
          setShippingId(def.id)
          setBillingId(def.id)
        }
        setConfig(c.data.data)
        setProvinces(p.data.data || [])
        const cfg = c.data.data
        const isValTrue = (v) => v === true || v === 'true' || v === 1 || v === '1'
        const codOn = isValTrue(cfg?.checkout?.cod_enabled) || isValTrue(cfg?.payment?.cod_enabled) || isValTrue(cfg?.cod_enabled)
        const khaltiOn = isValTrue(cfg?.payment?.khalti_enabled) || isValTrue(cfg?.khalti_enabled)
        const esewaOn = isValTrue(cfg?.payment?.esewa_enabled) || isValTrue(cfg?.esewa_enabled)
        setPaymentMethod(codOn ? 'cod' : khaltiOn ? 'khalti' : esewaOn ? 'esewa' : 'cod')
      })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [user])

  useEffect(() => {
    if (!user || loading) return
    const summaryParams = itemsKey ? { items: itemsKey } : {}
    api.get('/checkout/summary', { params: summaryParams })
      .then((s) => setSummary(s.data.data))
      .catch((e) => toast.error(errorMessage(e)))
  }, [itemsKey])

  const isConfigTrue = (v) => v === true || v === 'true' || v === 1 || v === '1'
  const codEnabled = isConfigTrue(config?.checkout?.cod_enabled)
    || isConfigTrue(config?.payment?.cod_enabled)
    || isConfigTrue(config?.cod_enabled)
    || isConfigTrue(config?.checkout?.['checkout.cod_enabled'])
    || isConfigTrue(config?.payment?.['payment.cod_enabled'])
  const khaltiEnabled = isConfigTrue(config?.payment?.khalti_enabled) || isConfigTrue(config?.khalti_enabled)
  const esewaEnabled = isConfigTrue(config?.payment?.esewa_enabled) || isConfigTrue(config?.esewa_enabled)
  const codMax = Number(config?.checkout?.cod_max_amount || config?.payment?.cod_max_amount || 100000)
  const total = Number(summary?.total || 0)
  const codAllowed = codEnabled && (codMax <= 0 || total <= codMax)

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
    if (esewaEnabled) {
      opts.push({
        value: 'esewa',
        label: 'eSewa Digital Wallet',
        icon: Wallet,
        logo: PAYMENT_BRAND_LOGOS.esewa,
        desc: 'Pay securely with eSewa wallet, internet banking or mobile banking.',
        badge: 'Instant',
      })
    }
    return opts
  }, [codEnabled, khaltiEnabled, esewaEnabled, codAllowed])

  const resolveGeoIds = async (loc) => {
    let provinceId = null
    let districtId = null
    let municipalityId = null
    const prov = provinces.find((p) => p.name === loc.province || p.name.toLowerCase().includes((loc.province || '').toLowerCase()))
    if (prov) {
      provinceId = prov.uuid
      const dRes = await api.get('/platform/districts', { params: { province_id: prov.id } })
      const dists = dRes.data.data || []
      const dist = dists.find((d) => d.name.toLowerCase() === (loc.district || '').toLowerCase() || d.name.toLowerCase().includes((loc.district || '').toLowerCase()))
      if (dist) {
        districtId = dist.uuid
        const mRes = await api.get('/platform/municipalities', { params: { district_id: dist.id } })
        const munis = mRes.data.data || []
        const cleanMuni = (loc.municipality || '').replace(/\s+(rural municipality|municipality|metropolitan city|sub-metropolitan city)$/i, '').trim().toLowerCase()
        const mun = munis.find((m) => 
          m.name.toLowerCase() === (loc.municipality || '').toLowerCase() ||
          m.name.toLowerCase().includes(cleanMuni) ||
          cleanMuni.includes(m.name.toLowerCase())
        )
        municipalityId = mun ? mun.uuid : null
      }
    }
    return { provinceId, districtId, municipalityId }
  }

  const saveAddress = async (e) => {
    e.preventDefault()
    setFormSaving(true)
    try {
      const geo = await resolveGeoIds(form)
      await api.post('/customer/addresses', {
        address_type: 'shipping',
        label: form.label || 'Home',
        full_name: form.name,
        phone: form.phone,
        address_line_1: form.street || `${form.municipality || ''}, ${form.district || ''}`.trim(),
        address_line_2: '',
        province_id: geo.provinceId,
        district_id: geo.districtId,
        municipality_id: geo.municipalityId,
        postal_code: '',
        landmark: form.landmark || '',
        latitude: form.latitude != null ? String(form.latitude) : null,
        longitude: form.longitude != null ? String(form.longitude) : null,
        is_default: form.is_default,
      })
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
        item_ids: selectedItemIds?.length ? selectedItemIds : undefined,
      })
      const session = res.data.data
      const orderRes = await api.post('/orders', {
        checkout_session_id: session.id,
        customer_notes: notes || undefined,
      })
      const order = orderRes.data.data
      
      if (!location.state?.buyNow) {
        localStorage.removeItem('gosika_selected_cart_items')
      } else {
        try {
          const saved = localStorage.getItem('gosika_selected_cart_items')
          if (saved) {
            const parsed = JSON.parse(saved)
            if (Array.isArray(parsed) && selectedItemIds?.length) {
              const remaining = parsed.filter((id) => !selectedItemIds.includes(id))
              localStorage.setItem('gosika_selected_cart_items', JSON.stringify(remaining))
            }
          }
        } catch {}
      }
      fetchCart()

      if (paymentMethod === 'khalti') {
        try {
          const payRes = await api.post('/payments/initiate', { order_id: order.id, method: 'khalti' })
          const payment = payRes.data.data
          if (payment?.payment_url) {
            window.open(payment.payment_url, '_blank', 'noopener')
            toast.info('Please complete payment in the opened tab.')
            navigate('/order-success', { state: { order, orderId: order?.id, khalti: true, paymentId: payment.id } })
            return
          }
        } catch (payErr) {
          toast.error('Failed to initiate Khalti payment: ' + errorMessage(payErr))
          navigate(`/orders/${order.id}`)
          return
        }
      }
      if (paymentMethod === 'esewa') {
        try {
          const payRes = await api.post('/payments/initiate', {
            order_id: order.id,
            method: 'esewa',
            success_url: `${window.location.origin}/payments/esewa/callback`,
            failure_url: `${window.location.origin}/payments/esewa/callback?status=failure`,
          })
          const payment = payRes.data.data
          if (payment?.payment_form?.action && payment?.payment_form?.fields) {
            const formEl = document.createElement('form')
            formEl.method = 'POST'
            formEl.action = payment.payment_form.action
            formEl.style.display = 'none'
            Object.entries(payment.payment_form.fields).forEach(([key, value]) => {
              const input = document.createElement('input')
              input.type = 'hidden'
              input.name = key
              input.value = String(value)
              formEl.appendChild(input)
            })
            document.body.appendChild(formEl)
            toast.info('Redirecting to eSewa to complete payment…')
            formEl.submit()
            return
          }
        } catch (payErr) {
          toast.error('Failed to initiate eSewa payment: ' + errorMessage(payErr))
          navigate('/order-success', { state: { order, orderId: order?.id } })
          return
        }
      }
      navigate('/order-success', { state: { order, orderId: order?.id } })
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

  if (!checkoutItems.length) {
    return (
      <div className="page-shell container">
        <EmptyState
          title="No items selected for checkout"
          message="Please select at least one item from your cart to proceed with checkout."
          action={<Link to="/cart" className="btn btn-primary">Go to Cart</Link>}
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
                          <span className="font-semibold" style={{ fontSize: 14 }}>{a.full_name || a.name}</span>
                          {a.label && <span className="chip chip-sm">{a.label}</span>}
                          {a.is_default && <span className="badge badge-primary">Default</span>}
                        </div>
                      </div>
                      <div className="muted text-sm" style={{ marginTop: 6, paddingLeft: 24 }}>
                        {a.address_line_1 && `${a.address_line_1}, `}{a.municipality?.name || a.municipality || ''}{a.district?.name || a.district ? `, ${a.district?.name || a.district}` : ''}{a.province?.name || a.province ? `, ${a.province?.name || a.province}` : ''}
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
                          <span className="font-semibold">{a.full_name || a.name}</span>
                        </div>
                        <div className="muted text-xs" style={{ marginTop: 4, paddingLeft: 24 }}>
                          {a.municipality?.name || a.municipality}{a.district?.name || a.district ? `, ${a.district?.name || a.district}` : ''}{a.province?.name || a.province ? `, ${a.province?.name || a.province}` : ''}
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
                {!paymentOptions.length && (
                  <div className="alert alert-warning" style={{ margin: 0 }}>
                    No payment methods are currently available. Please try again later or contact support.
                  </div>
                )}

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
                      {o.logo ? (
                        <img src={o.logo} alt={o.label} style={{ width: 64, height: 'auto', maxHeight: 34, objectFit: 'contain' }} />
                      ) : (
                        <o.icon size={22} color="var(--primary)" />
                      )}
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
                <button className="btn btn-primary" onClick={() => setStep(3)} disabled={!paymentOptions.length}>
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
                    <div className="font-semibold text-sm mt-1">{selectedAddress?.full_name || selectedAddress?.name}</div>
                    <div className="muted text-xs mt-1">
                      {selectedAddress?.address_line_1 && `${selectedAddress.address_line_1}, `}{selectedAddress?.municipality?.name || selectedAddress?.municipality || ''}{selectedAddress?.district?.name || selectedAddress?.district ? `, ${selectedAddress?.district?.name || selectedAddress?.district}` : ''}{selectedAddress?.province?.name || selectedAddress?.province ? `, ${selectedAddress?.province?.name || selectedAddress?.province}` : ''}
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
                  <span className="muted">Subtotal ({checkoutItems.length} items)</span>
                  <span className="font-semibold">{money(summary?.subtotal || itemsSubtotal)}</span>
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
                    {money(summary?.total || itemsSubtotal)}
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
                    <>Place Order ({money(summary?.total || itemsSubtotal)}) <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Persistent Order Summary */}
        <div className="order-summary-panel">
          <div className="order-summary-header">
            Items in Order ({checkoutItems.length})
          </div>
          <div className="order-summary-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 280, overflowY: 'auto' }}>
              {checkoutItems.map((item) => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: 10, alignItems: 'center' }}>
                  <span className="thumb" style={{ width: 48, height: 48, borderRadius: 6, overflow: 'hidden', background: 'var(--bg)' }}>
                    <img
                      src={item.image ? apiImage(item.image, item.name) : getProductImage(item, 0, true)}
                      alt={item.name || ''}
                      className="thumb-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={handleImgError}
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
              <span className="font-semibold">{money(summary?.subtotal || itemsSubtotal)}</span>
            </div>
            {Number(summary?.discount) > 0 && (
              <div className="order-summary-row">
                <span className="muted text-sm">Promotional Discount</span>
                <span className="text-success font-semibold text-sm">-{money(summary.discount)}</span>
              </div>
            )}
            <div className="order-summary-row">
              <span className="muted text-sm">Shipping</span>
              <span className="text-success font-semibold text-sm">
                {Number(summary?.delivery_charge) > 0 ? money(summary.delivery_charge) : 'Free'}
              </span>
            </div>
            <div className="order-summary-row">
              <span className="muted text-sm">Tax</span>
              <span className="font-semibold text-sm">{money(summary?.tax || 0)}</span>
            </div>
            <div className="order-summary-total">
              <span>Total</span>
              <span>{money(summary?.total || itemsSubtotal)}</span>
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
                landmark: loc.landmark,
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
