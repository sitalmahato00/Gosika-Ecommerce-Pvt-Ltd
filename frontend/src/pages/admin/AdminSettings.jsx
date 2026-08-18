import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  Save, Globe, Store, CreditCard, Truck, Building, Palette,
  Upload, X, Image, Phone, Mail, MapPin, FileText
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import Input from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { errorMessage } from '../../utils/format'
import { PAYMENT_BRAND_LOGOS, PAYMENT_GATEWAY_META } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'

const SETTING_DEFS = [
  { key: 'site_name', label: 'Marketplace Name', group: 'general', type: 'string', defaultValue: 'GOSIKA Commerce', icon: Building },
  { key: 'site_tagline', label: 'Tagline / Slogan', group: 'general', type: 'string', defaultValue: 'Nepal\'s Premier Online Marketplace' },
  { key: 'support_email', label: 'Support Email', group: 'general', type: 'string', defaultValue: 'support@gosika.com.np', icon: Mail },
  { key: 'support_phone', label: 'Support Phone', group: 'general', type: 'string', defaultValue: '+977-1-XXXXXXX', icon: Phone },
  { key: 'site_address', label: 'Business Address', group: 'general', type: 'string', defaultValue: 'Kathmandu, Nepal', icon: MapPin },
  { key: 'site_description', label: 'Site Description (SEO)', group: 'general', type: 'string', defaultValue: '' },
  { key: 'currency', label: 'Currency Code', group: 'general', type: 'string', defaultValue: 'NPR', options: ['NPR', 'USD', 'INR'] },
  { key: 'currency_symbol', label: 'Currency Symbol', group: 'general', type: 'string', defaultValue: 'रू' },
  { key: 'currency_position', label: 'Currency Position', group: 'general', type: 'string', defaultValue: 'before', options: ['before', 'after'] },

  { key: 'logo_light', label: 'Logo (Light Background) URL', group: 'branding', type: 'string', defaultValue: '' },
  { key: 'logo_dark', label: 'Logo (Dark Background) URL', group: 'branding', type: 'string', defaultValue: '' },
  { key: 'favicon_url', label: 'Favicon URL', group: 'branding', type: 'string', defaultValue: '' },
  { key: 'brand_color', label: 'Primary Brand Color (hex)', group: 'branding', type: 'string', defaultValue: '#6366f1' },
  { key: 'brand_color_dark', label: 'Dark Brand Color (hex)', group: 'branding', type: 'string', defaultValue: '#4338ca' },
  { key: 'homepage_hero_text', label: 'Homepage Hero Heading', group: 'branding', type: 'string', defaultValue: 'Discover Amazing Products' },
  { key: 'homepage_hero_sub', label: 'Homepage Hero Subtext', group: 'branding', type: 'string', defaultValue: 'Shop from thousands of sellers across Nepal' },
  { key: 'footer_text', label: 'Footer Copyright Text', group: 'branding', type: 'string', defaultValue: '' },

  { key: 'default_rate', label: 'Default Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '10' },
  { key: 'product_rate', label: 'Product Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '8' },
  { key: 'category_rate', label: 'Category Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '6' },
  { key: 'settlement.waiting_days', label: 'Settlement Holding Period (days)', group: 'commission', type: 'integer', defaultValue: '7' },
  { key: 'settlement.min_payout_amount', label: 'Minimum Payout Amount (NPR)', group: 'commission', type: 'decimal', defaultValue: '1000' },

  { key: 'shipping.flat_charge', label: 'Flat Delivery Fee (NPR)', group: 'shipping', type: 'decimal', defaultValue: '80' },
  { key: 'free_delivery_threshold', label: 'Free Delivery Threshold (NPR)', group: 'shipping', type: 'decimal', defaultValue: '2000' },
  { key: 'return.window_days', label: 'Return Window (days)', group: 'shipping', type: 'integer', defaultValue: '7' },
  { key: 'return.allow_returns', label: 'Allow Returns', group: 'shipping', type: 'boolean', defaultValue: 'true' },

  { key: 'checkout.cod_enabled', label: 'Enable Cash on Delivery', group: 'payment', type: 'boolean', defaultValue: 'true' },
  { key: 'payment.cod_instructions', label: 'COD Instructions (shown at checkout)', group: 'payment', type: 'string', defaultValue: 'Pay with cash upon delivery. Please keep exact change ready.' },
  { key: 'payment.cod_min_amount', label: 'COD Minimum Order (NPR)', group: 'payment', type: 'decimal', defaultValue: '0' },
  { key: 'payment.cod_max_amount', label: 'COD Maximum Order (NPR)', group: 'payment', type: 'decimal', defaultValue: '50000' },

  { key: 'payment.esewa_enabled', label: 'Enable eSewa', group: 'payment', type: 'boolean', defaultValue: 'false' },
  { key: 'payment.esewa_environment', label: 'eSewa Environment', group: 'payment', type: 'string', defaultValue: 'uat', options: ['uat', 'prod'] },
  { key: 'payment.esewa_product_code', label: 'eSewa Product Code (Merchant ID)', group: 'payment', type: 'string', defaultValue: 'EPAYTEST' },
  { key: 'payment.esewa_secret_key', label: 'eSewa Secret Key', group: 'payment', type: 'password', defaultValue: '' },
  { key: 'payment.esewa_success_url', label: 'eSewa Success (Return) URL', group: 'payment', type: 'string', defaultValue: '' },
  { key: 'payment.esewa_failure_url', label: 'eSewa Failure (Cancel) URL', group: 'payment', type: 'string', defaultValue: '' },

  { key: 'payment.khalti_enabled', label: 'Enable Khalti', group: 'payment', type: 'boolean', defaultValue: 'false' },
  { key: 'payment.khalti_environment', label: 'Khalti Environment', group: 'payment', type: 'string', defaultValue: 'uat', options: ['uat', 'prod'] },
  { key: 'payment.khalti_secret_key', label: 'Khalti Secret Key', group: 'payment', type: 'password', defaultValue: '' },
  { key: 'payment.khalti_public_key', label: 'Khalti Public Key', group: 'payment', type: 'password', defaultValue: '' },
  { key: 'payment.khalti_return_url', label: 'Khalti Return URL', group: 'payment', type: 'string', defaultValue: '' },
  { key: 'payment.khalti_website_url', label: 'Khalti Website URL', group: 'payment', type: 'string', defaultValue: '' },

  { key: 'payment.expiration_minutes', label: 'Payment Link Expiration (minutes)', group: 'payment', type: 'integer', defaultValue: '60' },

  { key: 'store.auto_approve', label: 'Auto-Approve Vendor Applications', group: 'store', type: 'boolean', defaultValue: 'false' },
  { key: 'store.auto_approve_products', label: 'Auto-Approve Vendor Products', group: 'store', type: 'boolean', defaultValue: 'false' },
  { key: 'store.allow_guest_browse', label: 'Allow Guest Browsing', group: 'store', type: 'boolean', defaultValue: 'true' },
]

const PAYMENT_GATEWAYS = [
  { id: 'cod', title: 'Cash on Delivery', prefix: 'payment.cod.', enabledKey: 'checkout.cod_enabled' },
  { id: 'esewa', title: 'eSewa', prefix: 'payment.esewa.', enabledKey: 'payment.esewa_enabled' },
  { id: 'khalti', title: 'Khalti', prefix: 'payment.khalti.', enabledKey: 'payment.khalti_enabled' },
]

const nullToEmpty = (v) => v === null || v === undefined || String(v).toLowerCase() === 'null' ? '' : v

const GROUP_META = {
  general: { label: 'General', icon: Globe, description: 'Basic marketplace identity and contact information' },
  branding: { label: 'Branding & Appearance', icon: Palette, description: 'Logos, colors, and brand customization' },
  commission: { label: 'Commissions & Payouts', icon: Store, description: 'Commission rates and vendor payout settings' },
  shipping: { label: 'Shipping & Returns', icon: Truck, description: 'Delivery fees, thresholds, and return policies' },
  payment: { label: 'Payment Gateways', icon: CreditCard, description: 'Configure online and offline payment methods' },
  store: { label: 'Store & Vendor', icon: Building, description: 'Vendor application and product approval rules' },
}

const defFor = (key) =>
  SETTING_DEFS.find((d) => d.key === key) ||
  SETTING_DEFS.find((d) => key.endsWith(`.${d.key}`))

export default function AdminSettings() {
  const toast = useToast()
  const { data, loading, error, reload } = useApi(() => api.get('/admin/settings'))
  const [form, setForm] = useState({})
  const [groupsMeta, setGroupsMeta] = useState({})
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    if (!data) return
    const next = {}
    const groups = {}
    data.forEach((s) => {
      next[s.key] = s.value
      groups[s.key] = { group: s.group || 'general', type: s.type || 'string', isPublic: !!s.is_public }
    })
    SETTING_DEFS.forEach((d) => {
      if (!(d.key in next)) next[d.key] = d.defaultValue
      if (!(d.key in groups)) groups[d.key] = { group: d.group, type: d.type, isPublic: false }
    })
    setForm(next)
    setGroupsMeta(groups)
  }, [data])

  const groups = useMemo(() => {
    return Object.keys(GROUP_META).filter((g) =>
      Object.keys(groupsMeta).some((k) => groupsMeta[k].group === g),
    )
  }, [groupsMeta])

  const keysForGroup = (group) =>
    Object.keys(groupsMeta).filter((k) => groupsMeta[k].group === group)

  const setValue = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const saveGroup = async (group) => {
    const keys = keysForGroup(group)
    if (!keys.length) return
    setSaving(group)
    try {
      for (const key of keys) {
        const meta = groupsMeta[key]
        const def = defFor(key)
        const needsPublic = key.startsWith('payment.') || key.startsWith('checkout.') || key.startsWith('shipping.') || key.startsWith('return.')
        await api.put(`/admin/settings/${key}`, {
          value: form[key],
          group: meta.group || def?.group || group,
          type: meta.type || def?.type || 'string',
          is_public: needsPublic,
        })
      }
      toast.success('Settings saved')
      reload()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(null)
    }
  }

  const saveAll = async () => {
    for (const g of groups) {
      await saveGroup(g)
    }
  }

  const renderField = (key) => {
    const meta = groupsMeta[key]
    const def = defFor(key)
    const label = def ? def.label : key.replace(/_/g, ' ')

    if (meta.type === 'boolean') {
      return (
        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
          <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>{label}</label>
          <button
            type="button"
            onClick={() => setValue(key, form[key] === 'true' || form[key] === true ? 'false' : 'true')}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
              background: (form[key] === 'true' || form[key] === true) ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
              left: (form[key] === 'true' || form[key] === true) ? 23 : 3,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      )
    }
    if (def?.options?.length) {
      return (
        <div key={key} className="form-group" style={{ marginBottom: 10 }}>
          <label className="label text-xs font-bold" style={{ color: 'var(--muted)' }}>{label}</label>
          <select className="select" value={nullToEmpty(form[key])} onChange={(e) => setValue(key, e.target.value)}>
            {def.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )
    }
    if (key.includes('color') || key.includes('hex')) {
      return (
        <div key={key} className="form-group" style={{ marginBottom: 10 }}>
          <label className="label text-xs font-bold" style={{ color: 'var(--muted)' }}>{label}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={nullToEmpty(form[key]) || '#6366f1'}
              onChange={(e) => setValue(key, e.target.value)}
              style={{ width: 40, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }}
            />
            <Input
              value={nullToEmpty(form[key])}
              onChange={(e) => setValue(key, e.target.value)}
              placeholder="#6366f1"
              style={{ flex: 1 }}
            />
          </div>
        </div>
      )
    }
    return (
      <Input
        key={key}
        label={label}
        type={def?.type === 'password' ? 'password' : 'text'}
        value={nullToEmpty(form[key])}
        onChange={(e) => setValue(key, e.target.value)}
        placeholder={def?.type === 'password' ? '••••••••••••' : def?.defaultValue || '—'}
        autoComplete={def?.type === 'password' ? 'new-password' : undefined}
      />
    )
  }

  const renderBranding = () => {
    const keys = keysForGroup('branding')
    const logoKeys = keys.filter((k) => k.includes('logo') || k.includes('favicon'))
    const colorKeys = keys.filter((k) => k.includes('color'))
    const textKeys = keys.filter((k) => !k.includes('logo') && !k.includes('favicon') && !k.includes('color'))

    return (
      <>
        {logoKeys.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Image size={16} /> Logo & Images
            </div>
            {form.logo_light && (
              <div style={{ marginBottom: 12, padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={form.logo_light} alt="Logo preview" style={{ height: 40, width: 'auto', borderRadius: 4, background: '#fff', padding: '4px 8px' }} onError={(e) => e.target.style.display = 'none'} />
                <div>
                  <div className="text-xs font-bold text-ink">Current Logo</div>
                  <div className="muted text-xs">Upload to /storage/logo/ and enter URL below</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logoKeys.map(renderField)}
            </div>
          </div>
        )}
        {colorKeys.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={16} /> Brand Colors
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {colorKeys.map((k) => (
                <div key={k} style={{ flex: 1 }}>{renderField(k)}</div>
              ))}
            </div>
            {form.brand_color && (
              <div style={{ marginTop: 8, padding: '8px 14px', borderRadius: 8, background: form.brand_color, color: '#fff', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                Primary Color Preview
              </div>
            )}
          </div>
        )}
        {textKeys.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={16} /> Content & Copy
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {textKeys.map(renderField)}
            </div>
          </div>
        )}
      </>
    )
  }

  const renderPayment = () => {
    const keys = keysForGroup('payment')
    const gatewayCards = PAYMENT_GATEWAYS.map((gw) => {
      const gwKeys = keys.filter((k) => k.startsWith(gw.prefix))
      const meta = PAYMENT_GATEWAY_META[gw.id] || {}
      const isEnabled = !!form[gw.enabledKey]
      return { ...gw, gwKeys, meta, isEnabled }
    })
    const otherKeys = keys.filter((k) => !PAYMENT_GATEWAYS.some((gw) => k.startsWith(gw.prefix)))

    return (
      <>
        {gatewayCards.map((gw) => (
          <div key={gw.id} className="card" style={{
            padding: 20, marginBottom: 16,
            border: gw.isEnabled ? `2px solid ${gw.meta.color || 'var(--primary)'}` : '2px solid var(--border)',
            background: gw.isEnabled ? (gw.meta.bg || 'var(--bg)') : 'var(--bg)',
            transition: 'all 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              {PAYMENT_BRAND_LOGOS[gw.id] ? (
                <img src={PAYMENT_BRAND_LOGOS[gw.id]} alt={gw.title} style={{ height: 28, width: 'auto', borderRadius: 4 }} />
              ) : (
                <div style={{ width: 40, height: 28, borderRadius: 6, background: gw.meta.color || '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                  {gw.title.substring(0, 4).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{gw.title}</div>
                {gw.meta.description && <div className="muted text-xs mt-0.5">{gw.meta.description}</div>}
              </div>
              <div style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: gw.isEnabled ? (gw.meta.color || 'var(--primary)') : 'var(--border)',
                color: gw.isEnabled ? '#fff' : 'var(--muted)',
              }}>
                {gw.isEnabled ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {gw.gwKeys.length > 0 ? gw.gwKeys.map(renderField) : (
                <div className="muted text-xs">No settings configured for this gateway yet.</div>
              )}
            </div>
          </div>
        ))}
        {otherKeys.length > 0 && (
          <div className="card" style={{ padding: 16, marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12 }}>General Payment Settings</div>
            {otherKeys.map(renderField)}
          </div>
        )}
      </>
    )
  }

  const renderGeneral = () => {
    const keys = keysForGroup('general')
    const contactKeys = keys.filter((k) => k.includes('email') || k.includes('phone') || k.includes('address'))
    const identityKeys = keys.filter((k) => !k.includes('email') && !k.includes('phone') && !k.includes('address'))

    return (
      <>
        {identityKeys.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building size={16} /> Marketplace Identity
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {identityKeys.map(renderField)}
            </div>
          </div>
        )}
        {contactKeys.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={16} /> Contact & Support
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contactKeys.map(renderField)}
            </div>
          </div>
        )}
      </>
    )
  }

  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Platform Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure marketplace identity, branding, payment gateways, shipping, commissions, and more.
          </p>
        </div>
        <button className="btn btn-primary" onClick={saveAll} disabled={!!saving}>
          <Save size={15} /> {saving ? 'Saving…' : 'Save All Settings'}
        </button>
      </div>

      {loading ? (
        <Skeleton height={200} />
      ) : groups.length === 0 ? (
        <ErrorState message="No settings returned by the backend." onRetry={reload} />
      ) : (
        <>
          <div className="tabs" style={{ marginBottom: 20 }}>
            {groups.map((g) => {
              const Icon = GROUP_META[g].icon
              return (
                <button
                  key={g}
                  className={`tab ${activeTab === g ? 'active' : ''}`}
                  onClick={() => setActiveTab(g)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon size={15} />
                  {GROUP_META[g].label}
                </button>
              )
            })}
          </div>

          <div className="card" style={{ maxWidth: 780, padding: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, margin: 0 }}>{GROUP_META[activeTab].label}</h3>
              {GROUP_META[activeTab].description && (
                <p className="muted text-xs mt-1">{GROUP_META[activeTab].description}</p>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {activeTab === 'payment' ? renderPayment() : activeTab === 'branding' ? renderBranding() : activeTab === 'general' ? renderGeneral() : keysForGroup(activeTab).map(renderField)}
            </div>

            <div className="flex justify-end pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" disabled={saving === activeTab} onClick={() => saveGroup(activeTab)}>
                {saving === activeTab ? 'Saving…' : 'Save Group'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
