import React, { useEffect, useMemo, useState } from 'react'
import {
  Save, Globe, Store, CreditCard, Truck, Building
} from 'lucide-react'
import api from '../../api/client'
import { useApi } from '../../hooks/useApi'
import Input from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import ErrorState from '../../components/ui/ErrorState'
import { errorMessage } from '../../utils/format'
import { PAYMENT_BRAND_LOGOS } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'

const SETTING_DEFS = [
  { key: 'site_name', label: 'Marketplace Name', group: 'general', type: 'string', defaultValue: 'GOSIKA Commerce' },
  { key: 'support_email', label: 'Support Email', group: 'general', type: 'string', defaultValue: 'support@gosika.com.np' },
  { key: 'currency', label: 'Currency Code', group: 'general', type: 'string', defaultValue: 'NPR' },
  { key: 'default_rate', label: 'Default Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '10' },
  { key: 'product_rate', label: 'Product Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '8' },
  { key: 'category_rate', label: 'Category Commission Rate (%)', group: 'commission', type: 'decimal', defaultValue: '6' },
  { key: 'free_delivery_threshold', label: 'Free Delivery Threshold (NPR)', group: 'shipping', type: 'decimal', defaultValue: '2000' },
  { key: 'commission', label: 'Store Commission (%)', group: 'store', type: 'decimal', defaultValue: '5' },
  { key: 'payment.esewa_enabled', label: 'Enable eSewa', group: 'payment', type: 'boolean', defaultValue: 'false' },
  { key: 'payment.esewa_environment', label: 'eSewa Environment', group: 'payment', type: 'string', defaultValue: 'uat', options: ['uat', 'prod'] },
  { key: 'payment.esewa_product_code', label: 'eSewa Product Code (Merchant)', group: 'payment', type: 'string', defaultValue: 'EPAYTEST' },
  { key: 'payment.esewa_secret_key', label: 'eSewa Secret Key', group: 'payment', type: 'password', defaultValue: '' },
  { key: 'payment.esewa_success_url', label: 'eSewa Success (Return) URL', group: 'payment', type: 'string', defaultValue: '' },
  { key: 'payment.esewa_failure_url', label: 'eSewa Failure (Cancel) URL', group: 'payment', type: 'string', defaultValue: '' },
  { key: 'payment.khalti_enabled', label: 'Enable Khalti', group: 'payment', type: 'boolean', defaultValue: 'false' },
  { key: 'payment.khalti_base_url', label: 'Khalti API Base URL', group: 'payment', type: 'string', defaultValue: 'https://dev.khalti.com/api/v2' },
  { key: 'payment.khalti_secret_key', label: 'Khalti Secret Key', group: 'payment', type: 'password', defaultValue: '' },
  { key: 'payment.khalti_return_url', label: 'Khalti Return URL', group: 'payment', type: 'string', defaultValue: '' },
  { key: 'payment.khalti_website_url', label: 'Khalti Website URL', group: 'payment', type: 'string', defaultValue: '' },
  { key: 'payment.expiration_minutes', label: 'Payment Link Expiration (minutes)', group: 'payment', type: 'integer', defaultValue: '60' },
]

const PAYMENT_SECTIONS = [
  { title: 'eSewa', prefix: 'payment.esewa.', logo: PAYMENT_BRAND_LOGOS.esewa },
  { title: 'Khalti', prefix: 'payment.khalti.' },
]

const nullToEmpty = (value) =>
  value === null || value === undefined || String(value).toLowerCase() === 'null' ? '' : value

const GROUP_META = {
  general: { label: 'General & Identity', icon: Globe },
  commission: { label: 'Commissions & Payouts', icon: Store },
  shipping: { label: 'Shipping & Delivery', icon: Truck },
  payment: { label: 'Payment Gateways', icon: CreditCard },
  store: { label: 'Store Configuration', icon: Building },
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
        await api.put(`/admin/settings/${key}`, {
          value: form[key],
          group: meta.group || defFor(key)?.group || group,
          type: meta.type || defFor(key)?.type || 'string',
          is_public: meta.isPublic,
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
        <label key={key} className="checkbox-row" style={{ fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={!!form[key]}
            onChange={(e) => setValue(key, e.target.checked)}
          />
          <span style={{ textTransform: 'capitalize' }}>{label}</span>
        </label>
      )
    }
    if (def?.options?.length) {
      return (
        <div key={key} className="form-group">
          <label className="label">{label}</label>
          <select
            className="input"
            value={nullToEmpty(form[key])}
            onChange={(e) => setValue(key, e.target.value)}
          >
            {def.options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
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
        placeholder={def?.type === 'password' ? '••••••••••••' : '—'}
        autoComplete={def?.type === 'password' ? 'new-password' : undefined}
      />
    )
  }

  const renderSections = () => {
    const keys = keysForGroup(activeTab)
    if (activeTab === 'payment') {
      const sections = PAYMENT_SECTIONS.map((s) => ({
        ...s,
        keys: keys.filter((k) => k.startsWith(s.prefix)),
      }))
      const otherKeys = keys.filter((k) => !PAYMENT_SECTIONS.some((s) => k.startsWith(s.prefix)))
      if (otherKeys.length) sections.push({ title: 'General Payment Settings', prefix: '', keys: otherKeys })
      return sections
        .filter((s) => s.keys.length)
        .map((s, idx) => (
          <React.Fragment key={s.title}>
            {idx > 0 && <div className="divider" style={{ margin: '4px 0' }} />}
            <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 14, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {s.logo && <img src={s.logo} alt={s.title} style={{ height: 18, width: 'auto' }} />}
              {s.title}
            </div>
            {s.keys.map(renderField)}
          </React.Fragment>
        ))
    }
    return keys.map(renderField)
  }

  if (error) return <ErrorState message={errorMessage(error)} onRetry={reload} />

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Platform Settings</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Configure marketplace operational defaults, gateway credentials, commissions, and regional parameters.
          </p>
        </div>
        <button className="btn btn-primary" onClick={saveAll} disabled={!!saving}>
          <Save size={15} /> Save All Settings
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
            <h3 style={{ fontSize: 16, margin: '0 0 16px' }}>{GROUP_META[activeTab].label}</h3>
            <div className="flex flex-col gap-3">
              {renderSections()}
            </div>

            <div className="flex justify-end pt-4 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                className="btn btn-primary"
                disabled={saving === activeTab}
                onClick={() => saveGroup(activeTab)}
              >
                {saving === activeTab ? 'Saving…' : 'Save Group'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
